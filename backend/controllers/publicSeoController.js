import PageSeo from '../models/PageSeo.js';
import PseoPage from '../models/PseoPage.js';
import Blog from '../models/Blog.js';
import Redirect from '../models/Redirect.js';
import { buildSeoHead } from '../services/seoHtmlService.js';
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

/**
 * How long the build endpoints reuse a computed answer. A build asks for
 * every page within seconds, so this mostly absorbs repeated or abusive
 * calls; an admin edit is still picked up by the next build.
 */
const BUILD_CACHE_MS = 30 * 1000;
const MAX_PATH_LENGTH = 300;

let pathListCache = { at: 0, value: null };
const headCache = new Map();

/**
 * Forget cached build answers, after an edit that changes which pages exist
 * or what their heads say, so a build started straight after sees the edit.
 */
export function clearSeoBuildCache() {
  pathListCache = { at: 0, value: null };
  headCache.clear();
}

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
async function collectBuildPaths() {
  if (pathListCache.value && Date.now() - pathListCache.at < BUILD_CACHE_MS) {
    return pathListCache.value;
  }
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
  pathListCache = { at: Date.now(), value };
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

    const cached = headCache.get(path);
    let head = cached && Date.now() - cached.at < BUILD_CACHE_MS ? cached.value : null;
    if (!head) {
      head = await buildSeoHead(path);
      headCache.set(path, { at: Date.now(), value: head });
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
