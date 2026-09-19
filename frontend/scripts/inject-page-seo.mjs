/**
 * Inject admin page metadata into the pre-rendered HTML.
 *
 * Titles and descriptions set in Admin -> SEO -> Meta live in the database and
 * are applied by React after the page loads. Google runs JavaScript so it sees
 * them, but `view-source` and link scrapers - WhatsApp, Facebook, LinkedIn,
 * Slack - do not, so they fall back to the page's built-in copy.
 *
 * The pre-renderer cannot fetch that data itself: it drives a browser from the
 * build machine, and the API's CORS rules reject an origin that is not the live
 * site. This runs after the build as a plain server-side request, where CORS
 * does not apply, and rewrites the tags directly in each pre-rendered file.
 *
 * The result is a deploy-time snapshot: metadata edited in the admin panel
 * reaches `view-source` on the next deploy. Live edits still reach Google
 * immediately through the client-side path, unchanged by this.
 *
 * Fail-soft throughout: any page that cannot be fetched keeps whatever the
 * pre-renderer produced, and the build still succeeds.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const DIST = path.resolve(process.cwd(), 'dist');
const TIMEOUT_MS = 15000;

/** @returns {string} Origin serving the API, or '' to skip. */
function resolveOrigin() {
  const explicit = process.env.SEO_SOURCE_ORIGIN;
  if (explicit) return explicit.replace(/\/+$/, '');
  const api = process.env.VITE_API_BASE_URL;
  if (!api) return '';
  return api.replace(/\/+$/, '').replace(/\/api$/, '');
}

/** Escape a value for use inside a double-quoted HTML attribute. */
function attr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Escape a value for use as element text. */
function text(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Replace the first tag matching `pattern`, or append `markup` to <head> when
 * the page has no such tag yet.
 *
 * @param {string} html
 * @param {RegExp} pattern - Matches the existing tag.
 * @param {string} markup - Replacement tag.
 * @returns {string}
 */
function upsert(html, pattern, markup) {
  if (pattern.test(html)) return html.replace(pattern, () => markup);
  return html.replace(/<\/head>/i, `${markup}</head>`);
}

/** Every pre-rendered page: dist/index.html plus dist/<route>/index.html. */
async function findPages() {
  const pages = [];
  const root = path.join(DIST, 'index.html');
  try {
    await fs.access(root);
    pages.push({ route: '/', file: root });
  } catch {
    /* no root page; nothing to do */
  }
  const entries = await fs.readdir(DIST, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === 'assets' || entry.name === 'images') continue;
    const file = path.join(DIST, entry.name, 'index.html');
    try {
      await fs.access(file);
      pages.push({ route: `/${entry.name}`, file });
    } catch {
      /* directory without a pre-rendered page */
    }
  }
  return pages;
}

async function main() {
  const origin = resolveOrigin();
  if (!origin) {
    console.log('[page-seo] No SEO_SOURCE_ORIGIN or VITE_API_BASE_URL; leaving pre-rendered metadata as built.');
    return;
  }

  const pages = await findPages();
  for (const { route, file } of pages) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const response = await fetch(
        `${origin}/api/public/seo?path=${encodeURIComponent(route)}`,
        { signal: controller.signal },
      );
      clearTimeout(timer);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const config = (await response.json())?.config;
      if (!config) {
        console.log(`[page-seo] ${route}: no admin metadata, keeping built-in copy`);
        continue;
      }

      let html = await fs.readFile(file, 'utf8');
      const applied = [];

      if (config.title) {
        html = upsert(html, /<title[^>]*>[\s\S]*?<\/title>/i, `<title>${text(config.title)}</title>`);
        applied.push('title');
      }
      if (config.description) {
        html = upsert(
          html,
          /<meta[^>]+name=["']description["'][^>]*>/i,
          `<meta name="description" content="${attr(config.description)}">`,
        );
        applied.push('description');
      }
      if (config.keywords) {
        html = upsert(
          html,
          /<meta[^>]+name=["']keywords["'][^>]*>/i,
          `<meta name="keywords" content="${attr(config.keywords)}">`,
        );
        applied.push('keywords');
      }
      if (config.canonicalUrl) {
        html = upsert(
          html,
          /<link[^>]+rel=["']canonical["'][^>]*>/i,
          `<link rel="canonical" href="${attr(config.canonicalUrl)}">`,
        );
        applied.push('canonical');
      }
      // Open Graph falls back to the page title and description, because a
      // shared link showing the site default defeats the point of setting them.
      const ogTitle = config.ogTitle || config.title;
      if (ogTitle) {
        html = upsert(
          html,
          /<meta[^>]+property=["']og:title["'][^>]*>/i,
          `<meta property="og:title" content="${attr(ogTitle)}">`,
        );
        applied.push('og:title');
      }
      const ogDescription = config.ogDescription || config.description;
      if (ogDescription) {
        html = upsert(
          html,
          /<meta[^>]+property=["']og:description["'][^>]*>/i,
          `<meta property="og:description" content="${attr(ogDescription)}">`,
        );
        applied.push('og:description');
      }
      if (config.ogImage) {
        html = upsert(
          html,
          /<meta[^>]+property=["']og:image["'][^>]*>/i,
          `<meta property="og:image" content="${attr(config.ogImage)}">`,
        );
        applied.push('og:image');
      }
      if (config.noindex) {
        html = upsert(
          html,
          /<meta[^>]+name=["']robots["'][^>]*>/i,
          '<meta name="robots" content="noindex, nofollow">',
        );
        applied.push('noindex');
      }

      if (applied.length === 0) {
        console.log(`[page-seo] ${route}: admin record is empty, keeping built-in copy`);
        continue;
      }
      await fs.writeFile(file, html, 'utf8');
      console.log(`[page-seo] ${route}: applied ${applied.join(', ')}`);
    } catch (err) {
      console.warn(`[page-seo] ${route}: keeping built-in copy (${err.message})`);
    }
  }
}

main().catch((err) => {
  console.warn('[page-seo] skipped:', err.message);
});
