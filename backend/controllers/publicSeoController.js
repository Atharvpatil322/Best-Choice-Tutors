import PageSeo from '../models/PageSeo.js';

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
