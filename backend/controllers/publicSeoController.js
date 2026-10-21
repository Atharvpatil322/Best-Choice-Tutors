import PageSeo from '../models/PageSeo.js';
import PseoPage from '../models/PseoPage.js';
import Blog from '../models/Blog.js';
import Redirect from '../models/Redirect.js';
import { buildSeoHead } from '../services/seoHtmlService.js';
import { resolveRouteStatus } from '../services/routeStatus.js';
import { recordNotFound } from '../middlewares/seoTraffic.js';
import {
  getCachedPathList,
  setCachedPathList,
  getCachedHead,
  setCachedHead,
} from '../services/seoBuildCache.js';
import { PUBLIC_ROUTES, isPublicPath, subjectRoutes } from '../services/seoContentService.js';

/**
 * Paths whose redirects can be published as files: the static host reaches a
 * generated file at these depths through its placeholder rewrite rules.
 */
const STUB_SOURCE_PATTERN = /^\/(blog|tutors\/subject)\/[^/]+$/;

function normalizePath(rawPath) {
  if (!rawPath || typeof rawPath !== 'string') return '/';
  let path = rawPath.trim();
  if (!path) return '/';
  if (!path.startsWith('/')) path = `/${path}`;
  if (path.length > 1) {
    path = path.replace(/\/+/g, '/').replace(/\/$/, '');
  }
  return path;
}

export async function getSeoConfigByPath(req, res, next) {
  try {
    const rawPath = req.query.path || '/';
    const path = normalizePath(rawPath);
    const config = await PageSeo.findOne({ path }).lean();
    return res.status(200).json({ config: config || null });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/public/pseo?path=/maths-tutors-london
 *
 * Content for a generated landing page. Without this the frontend has nothing
 * to render at these paths and falls back to the not-found screen, while the
 * server reports 200 - and any page that did render would repeat the homepage
 * body, which is duplicate content across every generated URL.
 */
export async function getPseoPageByPath(req, res, next) {
  try {
    const path = normalizePath(req.query.path || '/');
    const page = await PseoPage.findOne({ path, isActive: true })
      .select('path title description heading intro subject location')
      .lean();
    return res.status(200).json({ page: page || null });
  } catch (err) {
    next(err);
  }
}

const MAX_PATH_LENGTH = 300;

/**
 * Every URL the static site publishes a file for, plus the permanent
 * redirects it can publish as forwarding pages.
 *
 * Pages are the fixed routes and published blog posts - not the sitemap,
 * because a page left out of the sitemap still needs correct markup.
 * Generated landing pages are not listed: they live at arbitrary top-level
 * paths that the static host's rewrite rules cannot reach, so a file for
 * them would never be served.
 *
 * @returns {Promise<{ pages: Array<{ path: string, kind: string }>, redirects: Array<{ from: string, to: string }> }>}
 */
export async function collectBuildPaths() {
  const cached = getCachedPathList();
  if (cached) return cached;
  const [blogs, redirects] = await Promise.all([
    Blog.find({ status: 'PUBLISHED' }).select('slug').lean(),
    Redirect.find({ isActive: true, matchType: 'exact', statusCode: { $in: [301, 308] } })
      .select('sourcePath targetUrl')
      .lean(),
  ]);

  const pages = [];
  const seen = new Set();
  const addPage = (path, kind) => {
    const normalised = normalizePath(path).toLowerCase();
    if (!isPublicPath(normalised) || seen.has(normalised)) return;
    seen.add(normalised);
    pages.push({ path: normalised, kind });
  };

  for (const route of PUBLIC_ROUTES) addPage(route.path, 'static');
  for (const route of await subjectRoutes()) addPage(route.path, 'subject');
  for (const blog of blogs) {
    if (blog.slug) addPage(`/blog/${blog.slug}`, 'blog');
  }

  // A live page always wins over a redirect left behind at the same path.
  const redirectPages = redirects
    .map((redirect) => ({ from: normalizePath(redirect.sourcePath).toLowerCase(), to: redirect.targetUrl }))
    .filter((redirect) => STUB_SOURCE_PATTERN.test(redirect.from) && !seen.has(redirect.from) && redirect.to);

  const value = { pages, redirects: redirectPages };
  setCachedPathList(value);
  return value;
}

/**
 * GET /api/public/seo-head?path=/blog/my-post
 *
 * The finished head tags for one URL, for the frontend build to write into
 * the page it publishes, and for the app to load a page's structured data
 * after in-app navigation. Only published pages and active generated pages
 * are answered, so the endpoint cannot be used to run lookups for arbitrary
 * paths.
 */
export async function getSeoHead(req, res, next) {
  try {
    const raw = typeof req.query.path === 'string' ? req.query.path : '/';
    if (raw.length > MAX_PATH_LENGTH) {
      return res.status(400).json({ message: 'Path is too long' });
    }
    const path = normalizePath(raw).toLowerCase();
    const { pages } = await collectBuildPaths();
    // Generated landing pages get no build file, but the app still loads
    // their structured data from here.
    const published =
      pages.some((page) => page.path === path) ||
      Boolean(await PseoPage.exists({ path, isActive: true }));
    if (!published) {
      return res.status(404).json({ message: 'Not a published page' });
    }

    let head = getCachedHead(path);
    if (!head) {
      head = await buildSeoHead(path);
      setCachedHead(path, head);
    }
    res.set('Cache-Control', 'no-store');
    return res.status(200).json(head);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/public/seo-paths
 * The URL list from collectBuildPaths, for the frontend build.
 */
export async function getSeoPaths(req, res, next) {
  try {
    const value = await collectBuildPaths();
    res.set('Cache-Control', 'no-store');
    return res.status(200).json(value);
  } catch (err) {
    next(err);
  }
}

/**
 * Reports accepted per visitor per minute, so the log cannot be flooded.
 * In memory: the API runs as a single instance.
 */
const NOT_FOUND_LIMIT_PER_MINUTE = 20;
/**
 * Cap on reports from everyone together. The per-visitor key comes from a
 * header a client can forge, so this is what actually bounds the work an
 * unauthenticated caller can cause.
 */
const NOT_FOUND_GLOBAL_LIMIT_PER_MINUTE = 300;
const notFoundReports = new Map();
let globalReports = [];

function allowReport(visitor) {
  const now = Date.now();
  const fresh = (times) => times.filter((at) => now - at < 60 * 1000);
  globalReports = fresh(globalReports);
  if (globalReports.length >= NOT_FOUND_GLOBAL_LIMIT_PER_MINUTE) return false;
  const recent = fresh(notFoundReports.get(visitor) || []);
  if (recent.length >= NOT_FOUND_LIMIT_PER_MINUTE) {
    notFoundReports.set(visitor, recent);
    return false;
  }
  recent.push(now);
  globalReports.push(now);
  notFoundReports.set(visitor, recent);
  // Forget visitors with nothing recent, rather than resetting everyone.
  if (notFoundReports.size > 5000) {
    for (const [key, times] of notFoundReports) {
      if (!fresh(times).length) notFoundReports.delete(key);
    }
  }
  return true;
}

/**
 * POST /api/public/not-found  { path, referrer }
 *
 * The live site is static, so the server never sees a visit to a missing
 * page; the app reports it from the "page not found" screen instead. Only
 * paths that really resolve to no page are recorded.
 */
export async function reportNotFound(req, res, next) {
  try {
    const raw = typeof req.body?.path === 'string' ? req.body.path.trim() : '';
    // Behind the host's proxy every request shares its address. The last
    // X-Forwarded-For entry is the one the host's own proxy added; earlier
    // entries are whatever the client sent.
    const forwarded = String(req.get('x-forwarded-for') || '').split(',').map((part) => part.trim()).filter(Boolean);
    const visitor = forwarded[forwarded.length - 1] || req.ip;
    if (!raw.startsWith('/') || raw.length > MAX_PATH_LENGTH || !allowReport(visitor)) {
      return res.status(202).json({ recorded: false });
    }
    const path = raw.split(/[?#]/)[0];
    if ((await resolveRouteStatus(path)) !== 404) return res.status(202).json({ recorded: false });
    const referrer = typeof req.body?.referrer === 'string' ? req.body.referrer : '';
    await recordNotFound(path, referrer, req.get('user-agent'));
    return res.status(202).json({ recorded: true });
  } catch (err) {
    next(err);
  }
}
