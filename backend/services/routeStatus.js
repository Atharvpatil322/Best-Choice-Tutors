/**
 * Route status
 *
 * Decides whether a URL is a real page or a miss.
 *
 * The SPA is served from a catch-all, so every URL used to answer 200 - a soft
 * 404. Search engines treat that as an invitation to index unlimited junk
 * URLs, and nothing ever drops out of the index because nothing ever reports
 * being gone. This resolves the path against the routes the app actually has,
 * so a miss can answer 404 while still serving the HTML that renders the
 * "page not found" screen.
 *
 * Kept in step with frontend/src/App.jsx by hand: a route added there and not
 * here answers 404 while still rendering, which is visible in the 404 log.
 */

import Blog from '../models/Blog.js';
import PseoPage from '../models/PseoPage.js';
import Redirect from '../models/Redirect.js';
import { CANONICAL_SUBJECTS } from '../constants/subjects.js';
import { subjectToSlug } from '../utils/subjectSlug.js';

/** Paths that exist exactly as written. */
const EXACT_ROUTES = new Set([
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/onboarding',
  '/age-consent',
  '/about',
  '/how-it-works',
  '/privacy',
  '/terms',
  '/contact',
  '/tutors',
  '/blog',
  '/index.html',
]);

/** Signed-in areas. Real routes, so they answer 200; robots.txt keeps them out. */
const AUTHENTICATED_PREFIXES = ['/dashboard', '/tutor', '/admin', '/auth', '/reset-password'];

const SUBJECT_SLUGS = new Set(CANONICAL_SUBJECTS.map(subjectToSlug));

/**
 * @param {string} requestPath - Path portion of the request URL.
 * @returns {Promise<number>} 200 when the path resolves to a page, else 404.
 */
export async function resolveRouteStatus(requestPath) {
  const path = normalize(requestPath);

  if (EXACT_ROUTES.has(path)) return 200;
  if (AUTHENTICATED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) return 200;

  const subject = path.match(/^\/tutors\/subject\/([^/]+)$/);
  if (subject) return SUBJECT_SLUGS.has(subject[1].toLowerCase()) ? 200 : 404;

  const blog = path.match(/^\/blog\/([^/]+)$/);
  if (blog) {
    const post = await Blog.findOne({ slug: blog[1], status: 'PUBLISHED' }).select('_id').lean();
    return post ? 200 : 404;
  }

  // Generated landing pages, and any path an admin has set up a redirect for -
  // the redirect middleware answers those before this ever runs, but a path
  // with a redirect defined is not a miss.
  const [pseo, redirect] = await Promise.all([
    PseoPage.findOne({ path, isActive: true }).select('_id').lean(),
    Redirect.findOne({ sourcePath: path }).select('_id').lean(),
  ]);
  if (pseo || redirect) return 200;

  return 404;
}

/**
 * Strip the query string and any trailing slash so "/about/" and "/about" are
 * the same route.
 *
 * @param {string} value
 * @returns {string}
 */
function normalize(value) {
  if (typeof value !== 'string' || !value) return '/';
  const path = value.split('?')[0].split('#')[0];
  if (path === '/') return '/';
  return path.replace(/\/+$/, '') || '/';
}
