import PageSeo from '../models/PageSeo.js';
import AdminAuditLog from '../models/AdminAuditLog.js';

import { noteSeoChange } from '../services/seoChangeService.js';

/**
 * Lower-cased path with a leading slash and no trailing slash. Pages are
 * looked up in lower case, so an override typed as "/About" must be stored as
 * "/about" or it would never apply.
 */
function normalizePath(rawPath) {
  if (!rawPath || typeof rawPath !== 'string') return '';
  let path = rawPath.trim();
  if (!path) return '';
  if (!path.startsWith('/')) path = `/${path}`;
  if (path.length > 1) {
    path = path.replace(/\/+/g, '/').replace(/\/$/, '');
  }
  return path.toLowerCase();
}

const TEXT_FIELDS = ['title', 'description', 'canonicalUrl', 'keywords', 'ogTitle', 'ogDescription', 'ogImage'];
const OG_TYPES = ['', 'website', 'article'];

/**
 * The page-meta fields present in a request. Fields the request leaves out
 * are not touched, so an editor that does not show a field can never wipe it.
 * An empty og:type means "decide from the page" (article for blog posts).
 *
 * @param {Object} body
 * @returns {Object}
 */
function buildSeoPayload(body = {}) {
  const payload = {};
  for (const field of TEXT_FIELDS) {
    if (body[field] !== undefined && body[field] !== null) payload[field] = String(body[field]).trim();
  }
  if (body.ogType !== undefined) {
    const ogType = String(body.ogType ?? '').trim();
    payload.ogType = OG_TYPES.includes(ogType) ? ogType : '';
  }
  if (body.noindex !== undefined) payload.noindex = Boolean(body.noindex);
  return payload;
}

export async function getSeoConfigs(req, res, next) {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied: Admin role required' });
    }
    const configs = await PageSeo.find().sort({ path: 1 }).lean();
    return res.status(200).json({ count: configs.length, configs });
  } catch (err) {
    next(err);
  }
}

export async function getSeoConfigById(req, res, next) {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied: Admin role required' });
    }
    const { id } = req.params;
    const config = await PageSeo.findById(id).lean();
    if (!config) {
      return res.status(404).json({ message: 'SEO config not found' });
    }
    return res.status(200).json(config);
  } catch (err) {
    next(err);
  }
}

export async function createSeoConfig(req, res, next) {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied: Admin role required' });
    }
    const path = normalizePath(req.body.path);
    if (!path) {
      return res.status(400).json({ message: 'Path is required' });
    }

    const payload = buildSeoPayload(req.body);
    const existing = await PageSeo.findOne({ path });
    if (existing) {
      const updated = await PageSeo.findByIdAndUpdate(
        existing._id,
        { $set: payload },
        { new: true, runValidators: true },
      ).lean();

      await AdminAuditLog.create({
        adminId: req.user._id,
        action: 'SEO_CONFIG_UPDATED',
        entityType: 'PageSeo',
        entityId: updated._id,
        metadata: {
          path: updated.path,
          ...payload,
        },
      });

      noteSeoChange('page meta');
      return res.status(200).json({ message: 'SEO configuration updated', config: updated, upserted: true });
    }

    const config = await PageSeo.create({ path, ...payload });

    await AdminAuditLog.create({
      adminId: req.user._id,
      action: 'SEO_CONFIG_CREATED',
      entityType: 'PageSeo',
      entityId: config._id,
      metadata: {
        path: config.path,
        ...payload,
      },
    });

    noteSeoChange('page meta');
    return res.status(201).json({ message: 'SEO configuration created', config });
  } catch (err) {
    next(err);
  }
}

export async function updateSeoConfig(req, res, next) {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied: Admin role required' });
    }

    const { id } = req.params;
    const existing = await PageSeo.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'SEO config not found' });
    }

    const newPath = normalizePath(req.body.path || existing.path);
    if (!newPath) {
      return res.status(400).json({ message: 'Path is required' });
    }

    if (newPath !== existing.path) {
      const collision = await PageSeo.findOne({ path: newPath, _id: { $ne: id } });
      if (collision) {
        return res.status(409).json({ message: 'Another SEO configuration already exists for this path' });
      }
    }

    const payload = buildSeoPayload(req.body);
    const updated = await PageSeo.findByIdAndUpdate(
      id,
      { $set: { path: newPath, ...payload } },
      { new: true, runValidators: true },
    ).lean();

    await AdminAuditLog.create({
      adminId: req.user._id,
      action: 'SEO_CONFIG_UPDATED',
      entityType: 'PageSeo',
      entityId: updated._id,
      metadata: {
        path: updated.path,
        ...payload,
      },
    });

    noteSeoChange('page meta');
    return res.status(200).json({ message: 'SEO configuration updated', config: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteSeoConfig(req, res, next) {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied: Admin role required' });
    }

    const { id } = req.params;
    const existing = await PageSeo.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'SEO config not found' });
    }

    await PageSeo.deleteOne({ _id: id });
    await AdminAuditLog.create({
      adminId: req.user._id,
      action: 'SEO_CONFIG_DELETED',
      entityType: 'PageSeo',
      entityId: existing._id,
      metadata: {
        path: existing.path,
      },
    });

    noteSeoChange('page meta');
    return res.status(200).json({ message: 'SEO configuration deleted' });
  } catch (err) {
    next(err);
  }
}
