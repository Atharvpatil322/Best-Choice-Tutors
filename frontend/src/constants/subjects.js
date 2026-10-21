/**
 * Canonical list of subjects for tutor/learner profiles, tuition requests, and search filters.
 * "Other" is a special option that triggers a custom subject text input (not stored).
 */

export const SUBJECT_OTHER = 'Other';

export const CANONICAL_SUBJECTS = [
  'Mathematics',
  'English',
  'Science',
  'Physics',
  'Chemistry',
  'Biology',
  'History',
  'Geography',
  'French',
  'Spanish',
  'German',
  'Computer Science',
  'Economics',
  'Business Studies',
  'Accounting',
  'Psychology',
  'Art',
  'Music',
  'Drama',
  'Physical Education',
  SUBJECT_OTHER,
];

/**
 * URL slug for a subject, e.g. "Computer Science" -> "computer-science".
 *
 * @param {string} subject - Canonical subject name.
 * @returns {string}
 */
export function subjectToSlug(subject) {
  return String(subject || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/* ------------------------------------------------------------ slug registry
 * Each subject page's URL slug is editable in the admin panel, so the slug
 * for a subject comes from the API rather than from the name. Until the API
 * answers, every subject uses the slug derived from its name - the URLs the
 * site has always had - so links work from the first render. Components that
 * build subject links re-render when the registry changes through the
 * useSubjectSlugs hook (src/hooks/useSubjectSlugs.js).
 */

const slugByName = new Map();
const listeners = new Set();
let registryVersion = 0;
let registryLoaded = false;

/**
 * Replace the registry.
 *
 * @param {Array<{ name: string, slug: string }>} subjects
 * @param {{ settled?: boolean }} [options] - settled: this is the API's answer
 *   (or its failure), not a possibly stale saved copy.
 */
export function setSubjectSlugs(subjects, { settled = true } = {}) {
  slugByName.clear();
  for (const { name, slug } of subjects || []) {
    if (name && slug) slugByName.set(name, slug);
  }
  registryLoaded = registryLoaded || settled;
  registryVersion += 1;
  listeners.forEach((listener) => listener());
}

/** Subscribe to registry changes; returns an unsubscribe function. */
export function subscribeSubjectSlugs(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Changes whenever the registry does, for useSyncExternalStore. */
export function getSubjectSlugsVersion() {
  return registryVersion;
}

/** Whether slugs from the API have arrived, so an unknown slug really is unknown. */
export function areSubjectSlugsLoaded() {
  return registryLoaded;
}

/**
 * Current URL slug for a subject page.
 *
 * @param {string} subject - Canonical subject name.
 * @returns {string}
 */
export function slugForSubject(subject) {
  return slugByName.get(subject) || subjectToSlug(subject);
}

/**
 * Canonical subject for a URL slug, or null when the slug matches none.
 * Matching goes through the slug on both sides, so "Computer-Science" and
 * "computer-science" resolve to the same subject.
 *
 * @param {string} slug - Slug taken from the URL.
 * @returns {string|null}
 */
export function slugToSubject(slug) {
  const normalized = subjectToSlug(slug);
  if (!normalized) return null;
  return (
    CANONICAL_SUBJECTS.find(
      (subject) => subject !== SUBJECT_OTHER && slugForSubject(subject) === normalized,
    ) || null
  );
}

/**
 * Canonical subject for a name typed or stored elsewhere, matched without
 * regard to case or spacing - "computer science" finds "Computer Science".
 *
 * @param {string} name
 * @returns {string|null}
 */
export function subjectFromName(name) {
  const normalized = subjectToSlug(name);
  if (!normalized) return null;
  return (
    CANONICAL_SUBJECTS.find(
      (subject) => subject !== SUBJECT_OTHER && subjectToSlug(subject) === normalized,
    ) || null
  );
}

/**
 * Path for the tutor listing, scoped to a subject when one is given.
 * The single place that decides the shape of these URLs.
 *
 * @param {string} [subject] - Canonical subject name; omit for all tutors.
 * @returns {string} e.g. "/tutors/subject/english" or "/tutors".
 */
export function tutorSearchPath(subject) {
  if (!subject || subject === SUBJECT_OTHER) return '/tutors';
  const slug = slugForSubject(subject);
  return slug ? `/tutors/subject/${slug}` : '/tutors';
}
