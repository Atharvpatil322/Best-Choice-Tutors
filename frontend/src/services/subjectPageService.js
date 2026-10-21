/**
 * Subject page service
 * Public reads of subject page content and redirects, and the admin editor's
 * list and update calls.
 */

import { getAuthToken } from './authService.js';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/+$/, '');

/** One request per subject page per page load. */
const pageCache = new Map();

/** Forget cached subject pages, after an admin edits one in this tab. */
export function clearSubjectPageCache() {
  pageCache.clear();
}

/**
 * Content for one subject page, or null when no subject uses the slug.
 *
 * @param {string} slug
 * @returns {Promise<Object|null>}
 */
export function getSubjectPage(slug) {
  if (!slug) return Promise.resolve(null);
  if (!pageCache.has(slug)) {
    pageCache.set(
      slug,
      fetch(`${API_BASE_URL}/public/subjects/${encodeURIComponent(slug)}`)
        .then((response) => (response.ok ? response.json() : { subject: null }))
        .then((data) => data.subject || null)
        .catch(() => {
          pageCache.delete(slug);
          return null;
        }),
    );
  }
  return pageCache.get(slug);
}

/**
 * Where an old address now lives, if an admin moved it.
 *
 * @param {string} path - Site path, e.g. /tutors/subject/maths.
 * @returns {Promise<string|null>} Target URL or path, or null.
 */
export async function findRedirect(path) {
  try {
    const response = await fetch(`${API_BASE_URL}/public/redirect?path=${encodeURIComponent(path)}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.redirect?.targetUrl || null;
  } catch {
    return null;
  }
}

/**
 * Issue an authenticated admin request and unwrap the JSON body.
 *
 * @param {string} path
 * @param {Object} [options]
 * @returns {Promise<Object>}
 */
async function adminRequest(path, options = {}) {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const response = await fetch(`${API_BASE_URL}/admin${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
}

/** Every subject page record. */
export const getAdminSubjects = () => adminRequest('/subjects');

/**
 * Update a subject page.
 * @param {string} name - Canonical subject name.
 * @param {Object} payload - slug, seoTitle, metaDescription, h1, intro, content,
 *   imageUrl, imageAlt, createRedirect.
 */
export const updateAdminSubject = (name, payload) =>
  adminRequest(`/subjects/${encodeURIComponent(name)}`, { method: 'PUT', body: payload });
