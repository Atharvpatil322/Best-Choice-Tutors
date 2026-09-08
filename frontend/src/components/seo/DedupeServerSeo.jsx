/**
 * Dedupe Server SEO
 *
 * The Express layer injects meta, canonical and JSON-LD into index.html so a
 * crawler that does not run JavaScript still sees them. Once React hydrates,
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
  'meta[property="og:url"]',
  'meta[property="og:type"]',
];

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

export default function DedupeServerSeo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const sweep = () => {
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
      observer.disconnect();
      window.clearTimeout(frame);
    };
  }, [pathname]);

  return null;
}
