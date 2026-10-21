/**
 * Write search-ready HTML for every public URL into the build output.
 *
 * The frontend deploys as a static site, so whatever is in a URL's HTML file
 * is what crawlers and link previews read before any JavaScript runs. Without
 * this step, blog posts, subject pages and every other URL without a file of
 * its own were served the prerendered homepage - its title, a canonical tag
 * pointing at the homepage, its headings and its FAQ schema.
 *
 * For each URL the API lists (GET /api/public/seo-paths), this fetches the
 * finished head tags (GET /api/public/seo-head) and:
 * - patches the page the prerenderer already wrote, keeping that page's own
 *   copy where the admin has not overridden it, or
 * - writes <path>/index.html from the plain app shell with the full head.
 * Old URLs with a permanent redirect get a small page that sends visitors and
 * crawlers to the new address (an instant meta refresh, which search engines
 * treat as a permanent redirect).
 *
 * The head is built by backend/services/seoHtmlService.js; applyHead below
 * mirrors its applySeoHead and must stay in step with it.
 *
 * Fail-soft throughout: if the API is unreachable the build still succeeds
 * with the pages as the prerenderer left them, and the reason is printed.
 *
 * Origin comes from SEO_SOURCE_ORIGIN, else VITE_API_BASE_URL with any /api
 * suffix removed. Skipped entirely when neither is set.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const DIST = path.resolve(process.cwd(), 'dist');
const SHELL = path.join(DIST, 'spa-shell.html');
const TIMEOUT_MS = 15000;
const CONCURRENCY = 6;

/** @returns {string} Origin serving the API, or '' to skip. */
function resolveOrigin() {
  const explicit = process.env.SEO_SOURCE_ORIGIN;
  if (explicit) return explicit.replace(/\/+$/, '');
  const api = process.env.VITE_API_BASE_URL;
  if (!api) return '';
  return api.replace(/\/+$/, '').replace(/\/api$/, '');
}

/** Site origin used to make redirect targets absolute. */
const SITE_ORIGIN = (process.env.SITE_URL || 'https://bestchoicetutors.com').replace(/\/+$/, '');

async function getJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Pattern matching every copy of the tag an entry manages. Mirrors
 * patternForKey in backend/services/seoHtmlService.js.
 *
 * @param {string} key
 * @returns {RegExp}
 */
function patternForKey(key) {
  if (key === 'title') return /<title\b[^>]*>[\s\S]*?<\/title>/gi;
  if (key === 'canonical') return /<link\b[^>]*\brel=["']canonical["'][^>]*>/gi;
  if (key === 'jsonld') return /<script\b[^>]*\btype=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi;
  const [attr, ...rest] = key.split(':');
  const name = rest.join(':').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`<meta\\b[^>]*\\b${attr}=["']${name}["'][^>]*>`, 'gi');
}

/**
 * Write head entries into a document. Mirrors applySeoHead in
 * backend/services/seoHtmlService.js.
 *
 * @param {string} html
 * @param {Array<{ key: string, html: string, owned: boolean }>} entries
 * @param {boolean} prerendered - The page carries its own written copy.
 * @returns {string}
 */
function applyHead(html, entries, prerendered) {
  let result = html;
  for (const entry of entries) {
    const pattern = patternForKey(entry.key);
    const exists = new RegExp(pattern.source, 'i').test(result);
    if (prerendered && exists && !entry.owned) continue;
    result = result.replace(pattern, '');
    if (entry.html) result = result.replace(/<\/head>/i, () => `${entry.html}\n</head>`);
  }
  return result;
}

/** Escape a value for an HTML attribute. */
function attr(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * A page that forwards to a new address. An instant meta refresh is treated
 * by search engines as a permanent redirect; the script keeps any query
 * string or fragment for visitors.
 *
 * @param {string} target - Absolute URL or site path.
 * @returns {string}
 */
function redirectPage(target) {
  const absolute = /^https?:\/\//i.test(target) ? target : `${SITE_ORIGIN}${target.startsWith('/') ? '' : '/'}${target}`;
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    '<title>Page moved</title>',
    `<link rel="canonical" href="${attr(absolute)}">`,
    `<meta http-equiv="refresh" content="0; url=${attr(absolute)}">`,
    `<script>location.replace(${JSON.stringify(absolute).replace(/</g, '\\u003c')} + location.search + location.hash);</script>`,
    '</head>',
    `<body><p>This page has moved to <a href="${attr(absolute)}">${attr(absolute)}</a>.</p></body>`,
    '</html>',
    '',
  ].join('\n');
}

/**
 * File that serves a site path: dist/index.html for "/", else
 * dist/<path>/index.html. Refuses paths that would escape dist.
 *
 * @param {string} sitePath
 * @returns {string|null}
 */
function fileForPath(sitePath) {
  const segments = sitePath.split('/').filter((segment) => segment && segment !== '.' && segment !== '..');
  const file = path.join(DIST, ...segments, 'index.html');
  return file.startsWith(DIST) ? file : null;
}

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

/** Run tasks with a small concurrency limit, so the API is not flooded. */
async function runLimited(items, worker) {
  const queue = [...items];
  const runners = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    while (queue.length) await worker(queue.shift());
  });
  await Promise.all(runners);
}

async function main() {
  const origin = resolveOrigin();
  if (!origin) {
    console.log('[seo-pages] No SEO_SOURCE_ORIGIN or VITE_API_BASE_URL; leaving pages as built.');
    return;
  }

  let shell;
  try {
    shell = await fs.readFile(SHELL, 'utf8');
  } catch {
    console.warn('[seo-pages] dist/spa-shell.html missing; only prerendered pages will be patched.');
  }

  let list;
  try {
    list = await getJson(`${origin}/api/public/seo-paths`);
  } catch (err) {
    console.warn(`[seo-pages] skipped: could not list pages (${err.message})`);
    return;
  }

  const counts = { patched: 0, written: 0, redirects: 0, failed: 0 };

  await runLimited(list.pages || [], async ({ path: sitePath }) => {
    const file = fileForPath(sitePath);
    if (!file) return;
    try {
      const head = await getJson(`${origin}/api/public/seo-head?path=${encodeURIComponent(sitePath)}`);
      const prerendered = await exists(file);
      if (!prerendered && !shell) return;
      const base = prerendered ? await fs.readFile(file, 'utf8') : shell;
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, applyHead(base, head.entries || [], prerendered), 'utf8');
      counts[prerendered ? 'patched' : 'written'] += 1;
    } catch (err) {
      counts.failed += 1;
      console.warn(`[seo-pages] ${sitePath}: left as built (${err.message})`);
    }
  });

  for (const redirect of list.redirects || []) {
    const file = fileForPath(redirect.from);
    // Never overwrite a real page with a redirect.
    if (!file || (await exists(file))) continue;
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, redirectPage(redirect.to), 'utf8');
    counts.redirects += 1;
  }

  console.log(
    `[seo-pages] patched ${counts.patched} prerendered, wrote ${counts.written} pages, ` +
      `${counts.redirects} redirects, ${counts.failed} failed`,
  );
}

main().catch((err) => {
  console.warn('[seo-pages] skipped:', err.message);
});
