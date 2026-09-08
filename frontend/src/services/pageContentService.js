/**
 * Page Content Service
 * API layer for editable page copy: the public read used by landing components
 * and the admin read/write used by the Pages screen.
 */

import { getAuthToken } from './authService.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Fetch the published copy for one page. Public, so no token is attached.
 * Returns an empty section map on any failure, which makes callers fall back to
 * the copy built into the component rather than rendering nothing.
 *
 * @param {string} pageKey - e.g. 'home', 'about', 'how-it-works', 'subjects'.
 * @returns {Promise<Object>} Map of sectionKey to content.
 */
export const getPublicPageContent = async (pageKey) => {
  try {
    const response = await fetch(`${API_BASE_URL}/public/page-content/${encodeURIComponent(pageKey)}`);
    if (!response.ok) return {};
    const data = await response.json();
    return data.sections || {};
  } catch {
    return {};
  }
};

/**
 * Issue an authenticated admin request.
 *
 * @param {string} path - Path relative to /admin/pages.
 * @param {Object} [options] - Fetch options; `body` is JSON-encoded when present.
 * @returns {Promise<Object>}
 */
async function adminRequest(path, options = {}) {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_BASE_URL}/admin/pages${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
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

/** Fetch the editable page/section registry. */
export const getPageRegistry = () => adminRequest('/registry');

/** Fetch saved content for one page, including inactive sections. */
export const getAdminPageContent = (pageKey) => adminRequest(`/${encodeURIComponent(pageKey)}`);

/** Create or replace the content of one section. */
export const updatePageSection = (pageKey, sectionKey, payload) =>
  adminRequest(`/${encodeURIComponent(pageKey)}/${encodeURIComponent(sectionKey)}`, {
    method: 'PUT',
    body: payload,
  });

/** Remove saved content so the section reverts to its built-in copy. */
export const resetPageSection = (pageKey, sectionKey) =>
  adminRequest(`/${encodeURIComponent(pageKey)}/${encodeURIComponent(sectionKey)}`, {
    method: 'DELETE',
  });
