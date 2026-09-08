/**
 * SEO traffic middleware
 *
 * Two concerns, both of which must run before the single-page-app handler:
 *
 * 1. `applyRedirects` — issues configured 301/302 responses so links published
 *    elsewhere keep working after a route changes. Runs before static files so
 *    a redirect wins over a stale prerendered page at the same path.
 *
 * 2. `logNotFound` — records page paths that match no known route, giving the
 *    SEO team a list of broken links worth redirecting. Because a single-page
 *    app answers every path with index.html, the server cannot rely on a 404
 *    status; it compares the path against the router's known patterns instead.
 */

import Redirect from '../models/Redirect.js';
import NotFoundLog from '../models/NotFoundLog.js';
import PseoPage from '../models/PseoPage.js';

/** Paths handled by the API, sockets or the build output — never page routes. */
const NON_PAGE_PREFIXES = ['/api', '/socket.io', '/assets', '/images'];

/** File extensions that indicate a static asset rather than a page. */
const ASSET_EXTENSION = /\.[a-z0-9]{2,5}$/i;

/**
 * Route patterns the React router can resolve. Kept in sync with
 * frontend/src/App.jsx. A path matching none of these, and no PSEO page, is a
 * genuine miss worth logging.
 */
const KNOWN_ROUTE_PATTERNS = [
  /^\/$/,
  /^\/(login|register|forgot-password|onboarding|age-consent|index\.html)$/,
  /^\/reset-password\/[^/]+$/,
  /^\/auth\/callback$/,
  /^\/(about|how-it-works|privacy|terms|contact|policy|privacy-policy)$/,
  /^\/blog$/,
  /^\/blog\/[^/]+$/,
  /^\/tutors$/,
  /^\/(dashboard|tutor|admin)(\/.*)?$/,
];

/**
 * Decide whether a request is for a page, as opposed to an API call or asset.
 *
 * @param {import('express').Request} req
 * @returns {boolean}
 */
function isPageRequest(req) {
  if (req.method !== 'GET') return false;
  const path = req.path;
  if (NON_PAGE_PREFIXES.some((prefix) => path.startsWith(prefix))) return false;
  if (ASSET_EXTENSION.test(path) && !path.endsWith('.html')) return false;
  return true;
}

/**
 * Resolve a configured redirect for the given path.
 * Exact matches are preferred, then prefix, then regular expressions, so a
 * specific rule always beats a broad one.
 *
 * @param {string} path - Request path without query string.
 * @returns {Promise<{ redirect: Object, target: string }|null>}
 */
async function findRedirect(path) {
  const exact = await Redirect.findOne({ isActive: true, matchType: 'exact', sourcePath: path });
  if (exact) return { redirect: exact, target: exact.targetUrl };

  const prefixRules = await Redirect.find({ isActive: true, matchType: 'prefix' }).lean();
  // Longest source first so /blog/archive wins over /blog.
  prefixRules.sort((a, b) => b.sourcePath.length - a.sourcePath.length);
  for (const rule of prefixRules) {
    if (path === rule.sourcePath || path.startsWith(`${rule.sourcePath}/`)) {
      const remainder = path.slice(rule.sourcePath.length);
      const target = rule.targetUrl.replace(/\/+$/, '') + remainder;
      return { redirect: rule, target };
    }
  }

  const regexRules = await Redirect.find({ isActive: true, matchType: 'regex' }).lean();
  for (const rule of regexRules) {
    try {
      const pattern = new RegExp(rule.sourcePath);
      if (pattern.test(path)) {
        return { redirect: rule, target: path.replace(pattern, rule.targetUrl) };
      }
    } catch {
      // An invalid pattern must not break request handling; skip it.
    }
  }

  return null;
}

/**
 * Express middleware issuing configured redirects.
 * Failures are swallowed: a redirect lookup problem must never take the site
 * down, so the request simply continues to normal handling.
 *
 * @returns {import('express').RequestHandler}
 */
export function applyRedirects() {
  return async (req, res, next) => {
    if (!isPageRequest(req)) return next();
    try {
      const match = await findRedirect(req.path);
      if (!match) return next();

      // Fire-and-forget: the visitor should not wait on analytics bookkeeping.
      Redirect.updateOne(
        { _id: match.redirect._id },
        { $inc: { hits: 1 }, $set: { lastHitAt: new Date() } },
      ).catch(() => {});

      const query = req.originalUrl.includes('?')
        ? req.originalUrl.slice(req.originalUrl.indexOf('?'))
        : '';
      return res.redirect(match.redirect.statusCode, match.target + query);
    } catch (err) {
      console.error('Redirect lookup failed:', err?.message);
      return next();
    }
  };
}

/**
 * Express middleware recording page paths that match no known route.
 * Aggregates by path with a hit counter rather than storing one row per
 * request, so bot traffic cannot inflate the collection.
 *
 * @returns {import('express').RequestHandler}
 */
export function logNotFound() {
  return async (req, res, next) => {
    if (!isPageRequest(req)) return next();

    const path = req.path;
    if (KNOWN_ROUTE_PATTERNS.some((pattern) => pattern.test(path))) return next();

    try {
      // A generated landing page is a real route even though the router does
      // not declare it statically.
      const pseo = await PseoPage.exists({ path: path.toLowerCase(), isActive: true });
      if (pseo) return next();

      const now = new Date();
      await NotFoundLog.findOneAndUpdate(
        { path },
        {
          $inc: { hits: 1 },
          $set: {
            lastSeenAt: now,
            lastReferrer: (req.get('referer') || '').slice(0, 500),
            lastUserAgent: (req.get('user-agent') || '').slice(0, 300),
          },
          $setOnInsert: { firstSeenAt: now },
        },
        { upsert: true },
      );
    } catch (err) {
      console.error('404 logging failed:', err?.message);
    }
    return next();
  };
}
