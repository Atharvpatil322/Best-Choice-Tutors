/**
 * Subject normalization utilities.
 * - Trim leading/trailing spaces
 * - Collapse repeated spaces
 * - Title case for consistency
 */

export const SUBJECT_MAX_LENGTH = 80;

/**
 * Title-case a string (first letter of each word uppercase).
 * @param {string} str
 * @returns {string}
 */
function toTitleCase(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Normalize a single subject string.
 * @param {string} subject
 * @returns {string} Normalized subject, or empty string if invalid
 */
export function normalizeSubject(subject) {
  if (subject == null || typeof subject !== 'string') return '';
  const trimmed = subject.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';
  if (trimmed.length > SUBJECT_MAX_LENGTH) return trimmed.slice(0, SUBJECT_MAX_LENGTH);
  return toTitleCase(trimmed);
}

/**
 * Normalize an array of subjects, deduplicate, and remove empty values.
 * @param {string[]} subjects
 * @returns {string[]}
 */
export function normalizeSubjects(subjects) {
  if (!Array.isArray(subjects)) return [];
  const seen = new Set();
  return subjects
    .map((s) => normalizeSubject(s))
    .filter((s) => {
      if (!s || seen.has(s)) return false;
      seen.add(s);
      return true;
    });
}
