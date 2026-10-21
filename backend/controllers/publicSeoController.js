import PageSeo from '../models/PageSeo.js';
import PseoPage from '../models/PseoPage.js';
import Blog from '../models/Blog.js';
import Redirect from '../models/Redirect.js';
import { buildSeoHead } from '../services/seoHtmlService.js';
import { PUBLIC_ROUTES, isPublicPath } from '../services/seoContentService.js';

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
 * GET /api/public/seo-head?path=/blog/my-post
 *
 * The finished head tags for one URL, for the frontend build to write into
 * the page it publishes. Not cached: the build must see the latest admin
 * edits, and only the build calls it.
 */
export async function getSeoHead(req, res, next) {
  try {
    const path = normalizePath(req.query.path || '/');
    if (!isPublicPath(path)) {
      return res.status(400).json({ message: 'Path is not a public page' });
    }
    const head = await buildSeoHead(path);
    res.set('Cache-Control', 'no-store');
    return res.status(200).json(head);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/public/seo-paths
 *
 * Every public URL the build should publish a file for, and the permanent
 * redirects it can publish as redirect pages. Pages come from the fixed
 * routes, published blog posts and active generated pages - not the sitemap,
 * because a page left out of the sitemap still needs correct markup.
 */
export async function getSeoPaths(req, res, next) {
  try {
    const [blogs, pseoPages, redirects] = await Promise.all([
      Blog.find({ status: 'PUBLISHED' }).select('slug').lean(),
      PseoPage.find({ isActive: true }).select('path').lean(),
      Redirect.find({ isActive: true, matchType: 'exact', statusCode: { $in: [301, 308] } })
        .select('sourcePath targetUrl')
        .lean(),
    ]);

    const pages = [];
    const seen = new Set();
    const addPage = (path, kind) => {
      const normalised = normalizePath(path);
      if (!isPublicPath(normalised) || seen.has(normalised)) return;
      seen.add(normalised);
      pages.push({ path: normalised, kind });
    };

    for (const route of PUBLIC_ROUTES) {
      addPage(route.path, route.path.startsWith('/tutors/subject/') ? 'subject' : 'static');
    }
    for (const blog of blogs) {
      if (blog.slug) addPage(`/blog/${blog.slug}`, 'blog');
    }
    for (const page of pseoPages) addPage(page.path, 'pseo');

    // A live page always wins over a redirect left behind at the same path.
    const redirectPages = redirects
      .map((redirect) => ({ from: normalizePath(redirect.sourcePath), to: redirect.targetUrl }))
      .filter((redirect) => STUB_SOURCE_PATTERN.test(redirect.from) && !seen.has(redirect.from) && redirect.to);

    res.set('Cache-Control', 'no-store');
    return res.status(200).json({ pages, redirects: redirectPages });
  } catch (err) {
    next(err);
  }
}
