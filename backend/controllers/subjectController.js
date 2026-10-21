/**
 * Subject pages controller
 *
 * Public: the subject list with current URL slugs (for menus and links) and a
 * single subject page's content. Admin: list and update subject pages,
 * including the URL slug with an optional redirect from the old address.
 */

import AdminAuditLog from '../models/AdminAuditLog.js';
import Redirect from '../models/Redirect.js';
import {
  listSubjects,
  subjectBySlug,
  updateSubject,
  SubjectValidationError,
} from '../services/subjectService.js';

/** Fields returned to the public site for one subject page. */
const PUBLIC_PAGE_FIELDS = ['name', 'slug', 'seoTitle', 'metaDescription', 'h1', 'intro', 'content', 'imageUrl', 'imageAlt'];

const pick = (record, fields) => Object.fromEntries(fields.map((field) => [field, record[field] ?? '']));

/**
 * GET /api/public/subjects
 * Every subject with its current slug, in menu order.
 */
export async function getPublicSubjects(req, res, next) {
  try {
    const subjects = await listSubjects();
    return res.status(200).json({ subjects: subjects.map((subject) => pick(subject, ['name', 'slug'])) });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/public/subjects/:slug
 * One subject page's content, or 404 when no subject uses the slug.
 */
export async function getPublicSubjectPage(req, res, next) {
  try {
    const subject = await subjectBySlug(req.params.slug);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    return res.status(200).json({ subject: pick(subject, PUBLIC_PAGE_FIELDS) });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/public/redirect?path=/tutors/subject/maths
 *
 * The active exact redirect for a path, if any. The live site is static, so
 * the server cannot answer an old address with a redirect itself; the app
 * asks here when a URL matches no page and forwards the visitor.
 */
export async function getPublicRedirect(req, res, next) {
  try {
    const raw = typeof req.query.path === 'string' ? req.query.path.trim() : '';
    if (!raw.startsWith('/') || raw.length > 300) return res.status(200).json({ redirect: null });
    const path = raw.length > 1 ? raw.replace(/\/+$/, '') : raw;
    // Sources are stored as typed; match either spelling of the path.
    const redirect = await Redirect.findOne({
      sourcePath: { $in: [path, path.toLowerCase()] },
      matchType: 'exact',
      isActive: true,
    })
      .select('targetUrl statusCode')
      .lean();
    return res.status(200).json({
      redirect: redirect ? { targetUrl: redirect.targetUrl, statusCode: redirect.statusCode } : null,
    });
  } catch (err) {
    next(err);
  }
}

/** Reject the request unless the caller is an administrator. */
function requireAdmin(req, res) {
  if (req.user?.role !== 'Admin') {
    res.status(403).json({ message: 'Access denied: Admin role required' });
    return false;
  }
  return true;
}

/**
 * GET /api/admin/subjects
 * Every subject page record for the admin editor.
 */
export async function getAdminSubjects(req, res, next) {
  if (!requireAdmin(req, res)) return;
  try {
    const subjects = await listSubjects();
    return res.status(200).json({ subjects });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/admin/subjects/:name
 * Update one subject page. A changed slug leaves a 301 redirect at the old
 * address unless createRedirect is false.
 */
export async function updateAdminSubject(req, res, next) {
  if (!requireAdmin(req, res)) return;
  try {
    const result = await updateSubject(req.params.name, req.body ?? {}, { adminId: req.user._id });
    try {
      await AdminAuditLog.create({
        adminId: req.user._id,
        action: 'SUBJECT_PAGE_UPDATED',
        entityType: 'Subject',
        entityId: result.subject._id,
        metadata: {
          name: result.subject.name,
          ...(result.previousSlug !== result.subject.slug
            ? { previousSlug: result.previousSlug, slug: result.subject.slug, redirectCreated: Boolean(result.redirect) }
            : {}),
        },
      });
    } catch (auditErr) {
      console.error('Subject page audit log failed:', auditErr?.message);
    }
    return res.status(200).json({
      message: 'Subject page updated',
      subject: result.subject,
      redirect: result.redirect,
    });
  } catch (err) {
    if (err instanceof SubjectValidationError) return res.status(400).json({ message: err.message });
    if (err?.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(err.errors)[0]?.message || 'Invalid subject page' });
    }
    if (err?.code === 11000) return res.status(409).json({ message: 'Another subject already uses that URL' });
    next(err);
  }
}
