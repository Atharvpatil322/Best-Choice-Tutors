/**
 * Subject normalization utilities.
 * - Trim leading/trailing spaces
 * - Collapse repeated spaces
 * - Title case for consistency
 */

const SUBJECT_MAX_LENGTH = 80;

/**
 * Title-case a string (first letter of each word uppercase).
 * @param {string} str
 * @returns {string}
 */
function toTitleCase(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Normalize a single subject string.
 * @param {string} subject
 * @returns {{ value: string, error?: string }} Normalized value or error message
 */
function normalizeSubject(subject) {
  if (subject == null || typeof subject !== 'string') return { value: '' };
  const trimmed = subject.trim().replace(/\s+/g, ' ');
  if (!trimmed) return { value: '' };
  if (trimmed.length > SUBJECT_MAX_LENGTH) {
    return { value: '', error: `Subject must be at most ${SUBJECT_MAX_LENGTH} characters` };
  }
  return { value: toTitleCase(trimmed) };
}

/**
 * Normalize an array of subjects, deduplicate, and remove empty values.
 * @param {string[]} subjects
 * @returns {{ values: string[], error?: string }}
 */
function normalizeSubjects(subjects) {
  if (!Array.isArray(subjects)) return { values: [] };
  const seen = new Set();
  const values = [];
  for (const s of subjects) {
    const { value, error } = normalizeSubject(s);
    if (error) return { values: [], error };
    if (!value || seen.has(value)) continue;
    seen.add(value);
    values.push(value);
  }
  return { values };
}

export { SUBJECT_MAX_LENGTH, normalizeSubject, normalizeSubjects };
