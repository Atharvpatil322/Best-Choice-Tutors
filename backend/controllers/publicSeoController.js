import PageSeo from '../models/PageSeo.js';
import PseoPage from '../models/PseoPage.js';

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
