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
 * The host rewrites every blog and subject URL to that page's file, so a
 * build that published none would turn them all into 404s. Requests are
 * retried, since the API may be restarting for the same deploy. If the page
 * list still cannot be fetched the build fails, and the host keeps serving
 * the previous deploy. A page whose head cannot be fetched still gets the
 * plain app shell, so it loads normally. Set SEO_PAGES_OPTIONAL=1 to skip
 * instead of failing.
 *
 * Origin comes from SEO_SOURCE_ORIGIN, else VITE_API_BASE_URL with any /api
 * suffix removed. Skipped entirely when neither is set.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const DIST = path.resolve(process.cwd(), 'dist');
const SHELL = path.join(DIST, 'spa-shell.html');
const TIMEOUT_MS = 45000;
const ATTEMPTS = 6;
const CONCURRENCY = 6;
const OPTIONAL = process.env.SEO_PAGES_OPTIONAL === '1';

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

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * GET a JSON document, retrying with backoff. A 404 is final: it means the
 * API does not publish that page, which retrying will not change.
 *
 * @param {string} url
 * @returns {Promise<Object>}
 */
async function getJson(url) {
  let lastError;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (response.status === 404) throw Object.assign(new Error('HTTP 404'), { final: true });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (err) {
      lastError = err;
      if (err.final || attempt === ATTEMPTS) break;
      await wait(Math.min(2000 * 2 ** (attempt - 1), 20000));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError;
}

/* Tag matching. Mirrors matcherForKey and applySeoHead in
   backend/services/seoHtmlService.js - keep the two in step. */

const META_TAG = /<meta\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi;
const LINK_TAG = /<link\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi;
const TITLE_TAG = /<title\b[^>]*>[\s\S]*?<\/title>/gi;
const SCRIPT_TAG = /<script\b(?:"[^"]*"|'[^']*'|[^'">])*>[\s\S]*?<\/script>/gi;

function hasAttribute(tag, attr, value) {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\s${attr}\\s*=\\s*["']${escaped}["']`, 'i').test(tag);
}

function matcherForKey(key) {
  if (key === 'title') return { pattern: TITLE_TAG, matches: () => true };
  if (key === 'canonical') return { pattern: LINK_TAG, matches: (tag) => hasAttribute(tag, 'rel', 'canonical') };
  if (key === 'jsonld') {
    return {
      pattern: SCRIPT_TAG,
      matches: (tag) => hasAttribute(tag.slice(0, tag.indexOf('>') + 1), 'type', 'application/ld+json'),
    };
  }
  if (key.startsWith('exact:')) {
    const [, name, ...rest] = key.split(':');
    const content = rest.join(':');
    return {
      pattern: META_TAG,
      matches: (tag) => hasAttribute(tag, 'name', name) && hasAttribute(tag, 'content', escapeAttr(content)),
    };
  }
  const [attr, ...rest] = key.split(':');
  const name = rest.join(':');
  return { pattern: META_TAG, matches: (tag) => hasAttribute(tag, attr, name) };
}

/** Escape a value the way the API escapes attribute values. */
function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Write head entries into a document.
 *
 * @param {string} html
 * @param {Array<{ key: string, html: string, owned: boolean }>} entries
 * @param {boolean} prerendered - The page carries its own written copy.
 * @returns {string}
 */
function applyHead(html, entries, prerendered) {
  if (!/<\/head>/i.test(html)) return html;
  let result = html;
  for (const entry of entries) {
    const { pattern, matches } = matcherForKey(entry.key);
    let found = false;
    const stripped = result.replace(pattern, (tag) => {
      if (!matches(tag)) return tag;
      found = true;
      return '';
    });
    if (prerendered && found && !entry.owned) continue;
    result = stripped;
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
  // The visitor's query string and fragment only carry over within this site.
  const keepQuery = absolute.startsWith(`${SITE_ORIGIN}/`) && !/[?#]/.test(absolute);
  const destination = JSON.stringify(absolute).replace(/</g, '\\u003c');
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    '<title>Page moved</title>',
    `<link rel="canonical" href="${attr(absolute)}">`,
    `<meta http-equiv="refresh" content="0; url=${attr(absolute)}">`,
    `<script>location.replace(${destination}${keepQuery ? ' + location.search + location.hash' : ''});</script>`,
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

  // The shell is required: without it no blog or subject page can be written.
  const shell = await fs.readFile(SHELL, 'utf8');

  let list;
  try {
    list = await getJson(`${origin}/api/public/seo-paths`);
  } catch (err) {
    if (OPTIONAL) {
      console.warn(`[seo-pages] skipped: could not list pages (${err.message})`);
      return;
    }
    throw new Error(`could not list pages from ${origin} (${err.message})`);
  }

  const counts = { patched: 0, written: 0, redirects: 0, failed: 0 };

  await runLimited(list.pages || [], async ({ path: sitePath }) => {
    const file = fileForPath(sitePath);
    if (!file) return;
    const prerendered = await exists(file);
    let entries = [];
    try {
      const head = await getJson(`${origin}/api/public/seo-head?path=${encodeURIComponent(sitePath)}`);
      entries = head.entries || [];
    } catch (err) {
      counts.failed += 1;
      console.warn(`[seo-pages] ${sitePath}: head unavailable, publishing the plain shell (${err.message})`);
      // A prerendered page is already complete; otherwise the shell still has
      // to exist at this path, or the host's rewrite would answer 404.
      if (prerendered) return;
    }
    const base = prerendered ? await fs.readFile(file, 'utf8') : shell;
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, applyHead(base, entries, prerendered), 'utf8');
    if (entries.length) counts[prerendered ? 'patched' : 'written'] += 1;
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
  if (OPTIONAL) {
    console.warn('[seo-pages] skipped:', err.message);
    return;
  }
  // Failing the build keeps the previous deploy live, which is better than
  // publishing a site whose blog and subject URLs all answer 404.
  console.error('[seo-pages] build failed:', err.message);
  process.exit(1);
});
