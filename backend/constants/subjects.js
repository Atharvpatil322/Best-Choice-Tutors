/**
 * Canonical subjects
 *
 * Mirrors frontend/src/constants/subjects.js, which drives the tutor profile
 * form and the search filters. Kept here so the API can reject a FAQ aimed at
 * a subject no page exists for, rather than storing content nothing renders.
 *
 * "Other" is deliberately absent: it is a free-text escape hatch on the tutor
 * form, not a subject with a page of its own.
 */

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
];

/**
 * Normalise a submitted subject.
 *
 * Blank, null and "General" all mean the same thing: an FAQ that is not tied to
 * any subject, stored as null so a single query can find them.
 *
 * @param {*} value - Raw value from a request body or query string.
 * @returns {{ ok: boolean, subject?: string|null, message?: string }}
 */
export function normalizeSubject(value) {
  if (value === undefined || value === null) return { ok: true, subject: null };
  if (typeof value !== 'string') return { ok: false, message: 'Subject must be a string' };

  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === 'general') return { ok: true, subject: null };

  // Match case-insensitively but store the canonical spelling, so "english"
  // and "English" cannot end up as two separate groups.
  const match = CANONICAL_SUBJECTS.find(
    (subject) => subject.toLowerCase() === trimmed.toLowerCase(),
  );
  if (!match) {
    return { ok: false, message: `Unknown subject: ${trimmed}` };
  }
  return { ok: true, subject: match };
}
