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
import PageSeo from '../models/PageSeo.js';
import { CANONICAL_SUBJECTS } from '../constants/subjects.js';
import { subjectToSlug } from '../utils/subjectSlug.js';
import { moveRedirects, movePageSeo } from './redirectMoveService.js';

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
  const existing = new Set((await Subject.find().select('name').lean()).map((subject) => subject.name));
  for (const [index, name] of CANONICAL_SUBJECTS.entries()) {
    if (existing.has(name)) continue;
    // A subject added to the list later may find its natural slug already
    // taken by another subject's renamed page; it then gets a numbered one
    // instead of breaking every subject lookup.
    const base = subjectToSlug(name);
    for (let attempt = 1; attempt <= 20; attempt += 1) {
      const slug = attempt === 1 ? base : `${base}-${attempt}`;
      try {
        await Subject.updateOne(
          { name },
          { $setOnInsert: { name, slug, order: index } },
          { upsert: true },
        );
        break;
      } catch (err) {
        if (err?.code !== 11000 || attempt === 20) throw err;
        // Another request may have created this subject meanwhile.
        if (await Subject.exists({ name })) break;
      }
    }
  }
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
  // https only: an http image on an https page is blocked as mixed content.
  if (/^https:\/\/[^\s]+$/i.test(url) || /^\/(?!\/)[^\s]*$/.test(url)) return url;
  throw new SubjectValidationError('Image must be a full https:// address or a path starting with /');
}

/** Raised when the page moved but its redirects could not all be updated. */
export class SubjectRedirectError extends Error {}

/**
 * Update a subject page.
 *
 * @param {string} name - Canonical subject name.
 * @param {Object} input - Any of slug and the editable fields, plus
 *   createRedirect (default true) for a slug change.
 * @param {{ adminId?: * }} [options]
 * @returns {Promise<{ subject: Object, previousSlug: string, redirect: Object|null }>}
 */
/**
 * Subject edits run one at a time. A rename is a record save followed by
 * several redirect updates; two renames interleaving could each undo part of
 * the other's redirects even though each record save is checked. The API runs
 * as a single instance (render.yaml), so an in-process queue is enough.
 */
let editQueue = Promise.resolve();

export function updateSubject(name, input = {}, options = {}) {
  const run = editQueue.then(() => applySubjectUpdate(name, input, options));
  editQueue = run.catch(() => {});
  return run;
}

async function applySubjectUpdate(name, input = {}, { adminId } = {}) {
  await ensureSubjects();
  const subject = await Subject.findOne({ name });
  if (!subject) throw new SubjectValidationError(`Unknown subject: ${name}`);

  // Refuse to save over a change made since this editor was opened: an editor
  // holding the old slug would otherwise move the page back and undo the
  // other admin's redirect.
  if (input.expectedSlug !== undefined && input.expectedSlug !== subject.slug) {
    throw new SubjectConflictError(
      `This page's URL was changed to /tutors/subject/${subject.slug} since you opened it. Reload and try again.`,
    );
  }

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
  try {
    // The schema uses optimistic concurrency, so this save fails if another
    // request saved the record after it was read - checked atomically, unlike
    // the expectedSlug comparison above.
    await subject.save();
  } catch (err) {
    if (err?.name === 'VersionError') {
      throw new SubjectConflictError('This page was changed by someone else just now. Reload and try again.');
    }
    throw err;
  }

  try {
    if (subject.slug !== previousSlug) {
      const oldPath = subjectPath(previousSlug);
      const newPath = subjectPath(subject.slug);
      try {
        redirect = await moveRedirects(oldPath, newPath, {
          createRedirect: input.createRedirect !== false,
          adminId,
          note: 'Subject page URL changed',
        });
        // Page-level SEO overrides keyed to the old address follow the page.
        await movePageSeo(oldPath, newPath);
      } catch (err) {
        throw new SubjectRedirectError(
          `The page moved to ${newPath}, but its redirects could not be updated (${err.message}). ` +
            'Check the Redirect tab in SEO settings.',
        );
      }
    }
  } finally {
    // The new slug is saved either way, so nothing may keep serving the old one.
    clearSubjectCache();
  }
  return { subject: subject.toObject(), previousSlug, redirect };
}

/** Raised when the record changed since the editor loaded it. */
export class SubjectConflictError extends Error {}
