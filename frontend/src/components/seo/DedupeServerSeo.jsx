/**
 * Dedupe Server SEO
 *
 * The build (or Express, when it serves the site) writes meta, canonical and
 * JSON-LD into each page's HTML so a crawler that does not run JavaScript still
 * sees them. Once React hydrates,
 * Helmet inserts its own copies, leaving two of each - and two canonicals is
 * worse than none, because a search engine may honour neither.
 *
 * This removes the server's copy only where Helmet has produced a replacement,
 * identified by the data-rh attribute Helmet stamps on its own tags. Anything
 * Helmet does not manage is left alone, so a page can never end up with no
 * description at all. With JavaScript disabled nothing runs and the server tags
 * remain, which is the point of injecting them.
 *
 * Rendered once at the app root and re-run on navigation, since Helmet rewrites
 * its tags per route.
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Tags where Helmet's version should win, matched one-for-one. */
const SINGLETON_SELECTORS = [
  'meta[name="description"]',
  'meta[name="keywords"]',
  'meta[name="robots"]',
  'link[rel="canonical"]',
  'meta[property="og:title"]',
  'meta[property="og:description"]',
  'meta[property="og:image"]',
  'meta[property="og:image:alt"]',
  'meta[property="og:url"]',
  'meta[property="og:type"]',
  'meta[property="og:site_name"]',
  'meta[name="twitter:card"]',
];

/**
 * Server tags that describe one particular URL. They are correct only for
 * the address the page was loaded at; after an in-app navigation they would
 * keep describing that first page, so they are removed and Helmet's tags for
 * the new route stand alone. Site-wide tags such as verification and the
 * site name are left in place.
 */
const PAGE_SPECIFIC_SELECTORS = [
  'meta[name="description"]',
  'meta[name="keywords"]',
  'meta[name="robots"]',
  'link[rel="canonical"]',
  'meta[property="og:title"]',
  'meta[property="og:description"]',
  'meta[property="og:image"]',
  'meta[property="og:image:alt"]',
  'meta[property="og:url"]',
  'meta[property="og:type"]',
  'script[type="application/ld+json"]',
];

/** Marks JSON-LD fetched for the current route after an in-app navigation. */
const ROUTE_SCHEMA_ATTR = 'data-route-schema';

/** Remove the server's copies of page-specific tags. */
function dropServerPageTags() {
  PAGE_SPECIFIC_SELECTORS.forEach((selector) => {
    document.head.querySelectorAll(selector).forEach((el) => {
      if (!el.hasAttribute('data-rh') && !el.hasAttribute(ROUTE_SCHEMA_ATTR)) el.remove();
    });
  });
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');
const SEO_HEAD_URL = API_BASE.endsWith('/api')
  ? `${API_BASE}/public/seo-head`
  : `${API_BASE}/api/public/seo-head`;

/**
 * Structured data for a route, from the same endpoint the build uses, so a
 * page reached by an in-app link carries the same JSON-LD as one loaded
 * directly. Resolves to an empty list for routes the site does not publish
 * (dashboards, admin) or when the API cannot be reached.
 *
 * @param {string} path
 * @returns {Promise<Object[]>}
 */
async function fetchRouteStructuredData(path) {
  try {
    const response = await fetch(`${SEO_HEAD_URL}?path=${encodeURIComponent(path)}`);
    if (!response.ok) return [];
    const head = await response.json();
    const markup = (head.entries || []).find((entry) => entry.key === 'jsonld')?.html || '';
    const doc = new DOMParser().parseFromString(`<head>${markup}</head>`, 'text/html');
    return Array.from(doc.querySelectorAll('script[type="application/ld+json"]')).map((el) =>
      JSON.parse(el.textContent),
    );
  } catch {
    return [];
  }
}

/** Replace the route JSON-LD with the given schemas. */
function setRouteStructuredData(schemas) {
  document.head.querySelectorAll(`script[${ROUTE_SCHEMA_ATTR}]`).forEach((el) => el.remove());
  schemas.forEach((schema) => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute(ROUTE_SCHEMA_ATTR, '');
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  });
}

/**
 * Drop server copies of a tag when Helmet has rendered its own.
 *
 * @param {string} selector - CSS selector matching every copy of one tag.
 */
function dedupeSingleton(selector) {
  const all = Array.from(document.head.querySelectorAll(selector));
  if (all.length < 2) return;
  const helmetOwned = all.filter((el) => el.hasAttribute('data-rh'));
  if (helmetOwned.length === 0) return;
  all.filter((el) => !el.hasAttribute('data-rh')).forEach((el) => el.remove());
}

/**
 * Drop server JSON-LD blocks whose @type Helmet has also rendered.
 * Matching on @type rather than the data-seo name, because the two layers
 * label the same schema differently.
 */
function dedupeStructuredData() {
  const blocks = Array.from(
    document.head.querySelectorAll('script[type="application/ld+json"]'),
  );
  const typeOf = (el) => {
    try {
      const parsed = JSON.parse(el.textContent);
      return Array.isArray(parsed) ? parsed.map((x) => x['@type']).join('+') : parsed['@type'];
    } catch {
      return null;
    }
  };
  const helmetTypes = new Set(
    blocks.filter((el) => el.hasAttribute('data-rh')).map(typeOf).filter(Boolean),
  );
  blocks
    .filter((el) => !el.hasAttribute('data-rh') && helmetTypes.has(typeOf(el)))
    .forEach((el) => el.remove());
}

/**
 * Navigation state for this page load. Module level rather than component
 * state, so it survives remounts and is not fooled by React running effects
 * twice in development.
 */
let lastPathname = null;
let hasNavigated = false;

export default function DedupeServerSeo() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Server tags describe only the address the HTML was served for. Once the
    // visitor has moved within the app they are replaced: Helmet supplies the
    // meta tags and the route's JSON-LD is fetched from the API.
    if (lastPathname !== null && lastPathname !== pathname) hasNavigated = true;
    lastPathname = pathname;
    const navigated = hasNavigated;

    let cancelled = false;
    if (navigated) {
      setRouteStructuredData([]);
      fetchRouteStructuredData(pathname).then((schemas) => {
        if (!cancelled) setRouteStructuredData(schemas);
      });
    }

    const sweep = () => {
      if (navigated) {
        dropServerPageTags();
        return;
      }
      SINGLETON_SELECTORS.forEach(dedupeSingleton);
      dedupeStructuredData();
    };

    // Most pages are lazy-loaded, so their Helmet tags appear well after this
    // component mounts - a single pass on mount would run before there is
    // anything to deduplicate. Watching the head instead catches tags whenever
    // they arrive. Our own removals retrigger the observer, which then finds
    // nothing left to do and settles.
    let frame = 0;
    const schedule = () => {
      window.clearTimeout(frame);
      frame = window.setTimeout(sweep, 50);
    };

    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.head, { childList: true, subtree: true });

    return () => {
      cancelled = true;
      observer.disconnect();
      window.clearTimeout(frame);
    };
  }, [pathname]);

  return null;
}
