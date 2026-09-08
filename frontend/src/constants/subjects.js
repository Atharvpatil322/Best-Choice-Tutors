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
  const slug = subject ? subjectToSlug(subject) : '';
  return slug ? `/tutors/subject/${slug}` : '/tutors';
}
