/**
 * Page Content Controller
 *
 * Public read and admin write for editable page copy. The public endpoint is
 * unauthenticated because the content it returns is already visible on the
 * site; it exists so components can fetch their section without shipping the
 * copy in the bundle.
 */

import PageContent from '../models/PageContent.js';
import AdminAuditLog from '../models/AdminAuditLog.js';
import { PAGE_SECTIONS, isKnownSection, getPageDefinition } from '../constants/pageSections.js';

/**
 * Reject the request unless the caller is an administrator.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {boolean} True when the caller may proceed.
 */
function requireAdmin(req, res) {
  if (req.user?.role !== 'Admin') {
    res.status(403).json({ message: 'Access denied: Admin role required' });
    return false;
  }
  return true;
}

/**
 * Shape a stored document for API responses, dropping internal fields.
 *
 * @param {Object} doc - Lean PageContent document.
 * @returns {Object}
 */
function serialise(doc) {
  return {
    pageKey: doc.pageKey,
    sectionKey: doc.sectionKey,
    heading: doc.heading || '',
    subheading: doc.subheading || '',
    body: doc.body || '',
    ctaLabel: doc.ctaLabel || '',
    ctaHref: doc.ctaHref || '',
    imageUrl: doc.imageUrl || '',
    imageAlt: doc.imageAlt || '',
    items: (doc.items || [])
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((item) => ({
        title: item.title || '',
        description: item.description || '',
        imageUrl: item.imageUrl || '',
        imageAlt: item.imageAlt || '',
        linkUrl: item.linkUrl || '',
        order: item.order ?? 0,
      })),
    isActive: doc.isActive !== false,
    updatedAt: doc.updatedAt,
  };
}

/**
 * GET /api/public/page-content/:pageKey
 * Public. Return active content for one page, keyed by section.
 * Unknown pages return an empty object rather than 404 so a component asking
 * for a page nobody has configured simply keeps its built-in copy.
 */
export async function getPublicPageContent(req, res, next) {
  try {
    const { pageKey } = req.params;
    if (!getPageDefinition(pageKey)) {
      return res.status(200).json({ pageKey, sections: {} });
    }

    const docs = await PageContent.find({ pageKey, isActive: true }).lean();
    const sections = {};
    for (const doc of docs) {
      sections[doc.sectionKey] = serialise(doc);
    }
    return res.status(200).json({ pageKey, sections });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/pages/registry
 * Admin only. Return the editable page/section registry so the admin panel can
 * build its forms without duplicating the definitions.
 */
export async function getPageRegistry(req, res, next) {
  if (!requireAdmin(req, res)) return;
  try {
    return res.status(200).json({ pages: PAGE_SECTIONS });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/pages/:pageKey
 * Admin only. Return saved content for a page, including inactive sections.
 */
export async function getAdminPageContent(req, res, next) {
  if (!requireAdmin(req, res)) return;
  try {
    const { pageKey } = req.params;
    const definition = getPageDefinition(pageKey);
    if (!definition) return res.status(404).json({ message: 'Unknown page' });

    const docs = await PageContent.find({ pageKey }).lean();
    const sections = {};
    for (const doc of docs) {
      sections[doc.sectionKey] = serialise(doc);
    }
    return res.status(200).json({ page: definition, sections });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/admin/pages/:pageKey/:sectionKey
 * Admin only. Create or replace the content of one section.
 */
export async function updatePageSection(req, res, next) {
  if (!requireAdmin(req, res)) return;
  try {
    const { pageKey, sectionKey } = req.params;
    if (!isKnownSection(pageKey, sectionKey)) {
      return res
        .status(400)
        .json({ message: 'Unknown page or section. Nothing on the site renders that content.' });
    }

    const { heading, subheading, body, ctaLabel, ctaHref, imageUrl, imageAlt, items, isActive } =
      req.body ?? {};

    const update = { pageKey, sectionKey, updatedBy: req.user._id };
    if (heading !== undefined) update.heading = heading;
    if (subheading !== undefined) update.subheading = subheading;
    if (body !== undefined) update.body = body;
    if (ctaLabel !== undefined) update.ctaLabel = ctaLabel;
    if (ctaHref !== undefined) update.ctaHref = ctaHref;
    if (imageUrl !== undefined) update.imageUrl = imageUrl;
    if (imageAlt !== undefined) update.imageAlt = imageAlt;
    if (isActive !== undefined) update.isActive = !!isActive;
    if (Array.isArray(items)) {
      update.items = items.map((item, index) => ({
        title: item.title ?? '',
        description: item.description ?? '',
        imageUrl: item.imageUrl ?? '',
        imageAlt: item.imageAlt ?? '',
        linkUrl: item.linkUrl ?? '',
        order: item.order ?? index,
      }));
    }

    const content = await PageContent.findOneAndUpdate(
      { pageKey, sectionKey },
      { $set: update },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    ).lean();

    try {
      await AdminAuditLog.create({
        adminId: req.user._id,
        action: 'PAGE_CONTENT_UPDATED',
        entityType: 'PageContent',
        entityId: content._id,
        metadata: { pageKey, sectionKey },
      });
    } catch (auditErr) {
      console.error('Page content audit log failed:', auditErr?.message);
    }

    return res.status(200).json({ message: 'Section saved successfully', section: serialise(content) });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/admin/pages/:pageKey/:sectionKey
 * Admin only. Remove saved content so the section reverts to the copy built
 * into the component.
 */
export async function resetPageSection(req, res, next) {
  if (!requireAdmin(req, res)) return;
  try {
    const { pageKey, sectionKey } = req.params;
    const removed = await PageContent.findOneAndDelete({ pageKey, sectionKey });
    if (!removed) {
      return res.status(404).json({ message: 'Nothing saved for that section' });
    }
    return res.status(200).json({ message: 'Section reset to its default content' });
  } catch (err) {
    next(err);
  }
}
