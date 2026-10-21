/**
 * Subject pages
 *
 * Reads and updates the per-subject page records, and keeps every subject URL
 * consumer (route status, sitemap, build page list, SEO head) on the same
 * slugs.
 *
 * Changing a slug works like a URL handle in a shop builder: the page moves to
 * the new address, and - unless the admin opts out - a permanent redirect is
 * left at the old one so links and search results keep working. Redirects
 * that already pointed at the old address are moved along with it, so a
 * visitor never follows a chain of hops.
 */

import Subject, { SUBJECT_SLUG_PATTERN } from '../models/Subject.js';
import Redirect from '../models/Redirect.js';
import PageSeo from '../models/PageSeo.js';
import { CANONICAL_SUBJECTS } from '../constants/subjects.js';
import { subjectToSlug } from '../utils/subjectSlug.js';
import { SITE_URL } from './seoSchemaBuilders.js';

export const SUBJECT_PATH_PREFIX = '/tutors/subject/';

/** Fields an admin may edit besides the slug. */
const EDITABLE_FIELDS = ['seoTitle', 'metaDescription', 'h1', 'intro', 'content', 'imageUrl', 'imageAlt'];

/**
 * Subjects change rarely and are read on every page build and route check,
 * so they are held briefly in memory. Updates clear the cache immediately.
 */
const CACHE_MS = 30 * 1000;
let cache = { at: 0, subjects: null };
let ensured = false;

/** Raised for input an admin can correct; answered with 400 and the message. */
export class SubjectValidationError extends Error {}

/** Forget cached subjects, after an edit. */
export function clearSubjectCache() {
  cache = { at: 0, subjects: null };
}

/**
 * Create a record for any canonical subject that has none, using the slug the
 * site has always used for it, so existing URLs keep working.
 */
export async function ensureSubjects() {
  if (ensured) return;
  await Subject.bulkWrite(
    CANONICAL_SUBJECTS.map((name, index) => ({
      updateOne: {
        filter: { name },
        update: { $setOnInsert: { name, slug: subjectToSlug(name), order: index } },
        upsert: true,
      },
    })),
    { ordered: false },
  );
  ensured = true;
}

/**
 * Every subject page record, in menu order.
 *
 * @returns {Promise<Object[]>}
 */
export async function listSubjects() {
  if (cache.subjects && Date.now() - cache.at < CACHE_MS) return cache.subjects;
  await ensureSubjects();
  const subjects = await Subject.find().sort({ order: 1, name: 1 }).lean();
  cache = { at: Date.now(), subjects };
  return subjects;
}

/**
 * The subject record for a URL slug, or null.
 *
 * @param {string} slug
 * @returns {Promise<Object|null>}
 */
export async function subjectBySlug(slug) {
  const wanted = String(slug || '').toLowerCase();
  if (!wanted) return null;
  const subjects = await listSubjects();
  return subjects.find((subject) => subject.slug === wanted) || null;
}

/**
 * Public path of a subject page.
 *
 * @param {string} slug
 * @returns {string}
 */
export function subjectPath(slug) {
  return `${SUBJECT_PATH_PREFIX}${slug}`;
}

/**
 * Validate a requested slug.
 *
 * @param {unknown} value
 * @returns {string} Normalised slug.
 */
function cleanSlug(value) {
  const slug = String(value ?? '').trim().toLowerCase();
  if (!slug) throw new SubjectValidationError('URL slug is required');
  if (slug.length > 80) throw new SubjectValidationError('URL slug cannot exceed 80 characters');
  if (!SUBJECT_SLUG_PATTERN.test(slug)) {
    throw new SubjectValidationError(
      'URL slug can only contain lowercase letters, numbers and single hyphens, for example gcse-maths',
    );
  }
  return slug;
}

/**
 * Accept an absolute http(s) URL or a site path for the share image.
 *
 * @param {unknown} value
 * @returns {string}
 */
function cleanImageUrl(value) {
  const url = String(value ?? '').trim();
  if (!url) return '';
  if (/^https?:\/\/[^\s]+$/i.test(url) || /^\/(?!\/)[^\s]*$/.test(url)) return url;
  throw new SubjectValidationError('Image must be a full https:// address or a path starting with /');
}

/**
 * Move redirects when a subject page changes address.
 *
 * - Nothing may redirect away from the new address any more: it is a live page.
 * - Redirects that ended at the old address now end at the new one, so there
 *   is never a chain of hops.
 * - Optionally, the old address itself redirects to the new one.
 *
 * @param {string} oldPath
 * @param {string} newPath
 * @param {{ createRedirect: boolean, adminId: * }} options
 * @returns {Promise<Object|null>} The redirect left at the old address, if any.
 */
async function moveRedirects(oldPath, newPath, { createRedirect, adminId }) {
  await Redirect.deleteMany({ sourcePath: newPath });

  const oldTargets = [oldPath, `${SITE_URL}${oldPath}`];
  await Redirect.updateMany({ targetUrl: { $in: oldTargets } }, { $set: { targetUrl: newPath } });

  let redirect = null;
  if (createRedirect) {
    redirect = await Redirect.findOneAndUpdate(
      { sourcePath: oldPath },
      {
        $set: {
          targetUrl: newPath,
          statusCode: 301,
          matchType: 'exact',
          isActive: true,
          note: 'Subject page URL changed',
        },
        $setOnInsert: { createdBy: adminId || null },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
    );
  }

  // Moving targets can never point a redirect at itself here, but a record
  // left over from earlier edits might; such a record would loop forever.
  await Redirect.deleteMany({ $expr: { $eq: ['$sourcePath', '$targetUrl'] } });
  return redirect;
}

/**
 * Update a subject page.
 *
 * @param {string} name - Canonical subject name.
 * @param {Object} input - Any of slug and the editable fields, plus
 *   createRedirect (default true) for a slug change.
 * @param {{ adminId?: * }} [options]
 * @returns {Promise<{ subject: Object, previousSlug: string, redirect: Object|null }>}
 */
export async function updateSubject(name, input = {}, { adminId } = {}) {
  await ensureSubjects();
  const subject = await Subject.findOne({ name });
  if (!subject) throw new SubjectValidationError(`Unknown subject: ${name}`);

  for (const field of EDITABLE_FIELDS) {
    if (input[field] === undefined) continue;
    if (input[field] !== null && typeof input[field] === 'object') {
      throw new SubjectValidationError(`${field} must be text`);
    }
    subject[field] = field === 'imageUrl' ? cleanImageUrl(input[field]) : String(input[field] ?? '');
  }

  const previousSlug = subject.slug;
  let redirect = null;
  if (input.slug !== undefined) {
    const slug = cleanSlug(input.slug);
    if (slug !== previousSlug) {
      const taken = await Subject.exists({ slug, _id: { $ne: subject._id } });
      if (taken) throw new SubjectValidationError(`Another subject already uses the URL /tutors/subject/${slug}`);
      subject.slug = slug;
    }
  }

  subject.updatedBy = adminId || null;
  await subject.save();

  if (subject.slug !== previousSlug) {
    const oldPath = subjectPath(previousSlug);
    const newPath = subjectPath(subject.slug);
    redirect = await moveRedirects(oldPath, newPath, {
      createRedirect: input.createRedirect !== false,
      adminId,
    });
    // Page-level SEO overrides keyed to the old address follow the page.
    const [oldSeo, newSeo] = await Promise.all([
      PageSeo.findOne({ path: oldPath }),
      PageSeo.exists({ path: newPath }),
    ]);
    if (oldSeo && !newSeo) {
      oldSeo.path = newPath;
      await oldSeo.save();
    }
  }

  clearSubjectCache();
  return { subject: subject.toObject(), previousSlug, redirect };
}
