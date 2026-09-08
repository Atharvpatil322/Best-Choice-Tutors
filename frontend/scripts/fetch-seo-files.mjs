/**
 * Fetch SEO files into the build output.
 *
 * The frontend deploys as a static site, so /robots.txt, /sitemap.xml and
 * /llms.txt are served from dist rather than by the API. Without this step
 * they are whatever was committed to public/, and the admin panel's robots and
 * sitemap settings never reach visitors - they only exist on the API domain,
 * which crawlers do not read.
 *
 * Running after the build copies the generated files in, so each deploy
 * publishes the current database-driven versions.
 *
 * Fail-soft on purpose: a build must not break because the API is briefly
 * unreachable. On failure the committed fallback in public/ is what ships, and
 * the reason is printed.
 *
 * Origin comes from SEO_SOURCE_ORIGIN, else VITE_API_BASE_URL with any /api
 * suffix removed. Skipped entirely when neither is set, which is the normal
 * case for a local build.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const FILES = ['robots.txt', 'sitemap.xml', 'llms.txt'];
const DIST = path.resolve(process.cwd(), 'dist');
const TIMEOUT_MS = 15000;

/** @returns {string} Origin serving the generated files, or '' to skip. */
function resolveOrigin() {
  const explicit = process.env.SEO_SOURCE_ORIGIN;
  if (explicit) return explicit.replace(/\/+$/, '');
  const api = process.env.VITE_API_BASE_URL;
  if (!api) return '';
  return api.replace(/\/+$/, '').replace(/\/api$/, '');
}

async function main() {
  const origin = resolveOrigin();
  if (!origin) {
    console.log('[seo-files] No SEO_SOURCE_ORIGIN or VITE_API_BASE_URL; keeping public/ copies.');
    return;
  }

  for (const file of FILES) {
    const url = `${origin}/${file}`;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body = await response.text();
      // A near-empty body means something answered but not with the real file
      // (an SPA fallback, for instance). Keeping the committed copy is safer.
      if (body.trim().length < 20) throw new Error('response too short to be the real file');

      await fs.writeFile(path.join(DIST, file), body, 'utf8');
      console.log(`[seo-files] ${file} <- ${url} (${body.length} bytes)`);
    } catch (err) {
      console.warn(`[seo-files] ${file}: keeping committed copy (${err.message})`);
    }
  }
}

main().catch((err) => {
  console.warn('[seo-files] skipped:', err.message);
});
