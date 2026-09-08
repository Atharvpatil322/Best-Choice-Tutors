/**
 * Subject URL slugs.
 *
 * Mirrors subjectToSlug in frontend/src/constants/subjects.js. The two must
 * agree: the frontend builds these URLs and the sitemap advertises them, so a
 * mismatch would publish links that redirect or 404.
 *
 * @param {string} subject - Canonical subject name, e.g. "Computer Science".
 * @returns {string} e.g. "computer-science".
 */
export function subjectToSlug(subject) {
  return String(subject || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
