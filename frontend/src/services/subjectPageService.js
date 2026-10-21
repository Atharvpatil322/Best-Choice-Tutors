/**
 * Subject page service
 * Public reads of subject page content and redirects, and the admin editor's
 * list and update calls.
 */

import { getAuthToken } from './authService.js';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/+$/, '');

/**
 * Subject pages fetched recently. Entries expire, so a tab left open still
 * notices when an admin renames a subject; only definite answers (found, or
 * 404) are kept - a failed request is retried next time.
 */
const PAGE_CACHE_MS = 60 * 1000;
const pageCache = new Map();

/** Forget cached subject pages, after an admin edits one in this tab. */
export function clearSubjectPageCache() {
  pageCache.clear();
}

/**
 * Content for one subject page.
 *
 * Resolves to the page, or to null only when the API confirms no subject uses
 * the slug (404). Rejects when the answer is unknown - a network failure or a
 * server error - so callers never mistake an outage for a removed page.
 *
 * @param {string} slug
 * @returns {Promise<Object|null>}
 */
export function getSubjectPage(slug) {
  if (!slug) return Promise.resolve(null);
  const cached = pageCache.get(slug);
  if (cached && Date.now() - cached.at < PAGE_CACHE_MS) return cached.promise;

  const promise = fetch(`${API_BASE_URL}/public/subjects/${encodeURIComponent(slug)}`).then(async (response) => {
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Subject page lookup failed (HTTP ${response.status})`);
    const data = await response.json();
    return data.subject || null;
  });
  pageCache.set(slug, { at: Date.now(), promise });
  promise.catch(() => {
    if (pageCache.get(slug)?.promise === promise) pageCache.delete(slug);
  });
  return promise;
}

/**
 * Where an old address now lives, if an admin moved it.
 *
 * @param {string} path - Site path, e.g. /tutors/subject/maths.
 * @returns {Promise<string|null>} Target URL or path, or null when there is
 *   no redirect. Rejects when the lookup itself fails.
 */
export async function findRedirect(path) {
  const response = await fetch(`${API_BASE_URL}/public/redirect?path=${encodeURIComponent(path)}`);
  if (!response.ok) throw new Error(`Redirect lookup failed (HTTP ${response.status})`);
  const data = await response.json();
  return data.redirect?.targetUrl || null;
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
