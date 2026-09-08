/**
 * SEO Tools Service
 * API layer for the tabbed SEO section: site-wide settings, redirects,
 * the 404 log, and programmatic landing pages.
 */

import { getAuthToken } from './authService.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const BASE = `${API_BASE_URL}/admin/seo-tools`;

/**
 * Issue an authenticated request and unwrap the JSON body.
 * Throws with the server's message so callers can surface it directly.
 *
 * @param {string} path - Path relative to the SEO tools base.
 * @param {Object} [options] - Fetch options; `body` is JSON-encoded when present.
 * @returns {Promise<Object>} Parsed response body.
 */
async function request(path, options = {}) {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${BASE}${path}`, {
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

/* -------------------------------------------------------------- dashboard */

/** Counts for the SEO overview tab. */
export const getSeoDashboard = () => request('/dashboard');

/* --------------------------------------------------------------- settings */

/** Fetch site-wide SEO settings. */
export const getSeoSettings = () => request('/settings');

/**
 * Update site-wide SEO settings.
 * @param {Object} payload - Any subset of the settings fields.
 */
export const updateSeoSettings = (payload) =>
  request('/settings', { method: 'PATCH', body: payload });

/* -------------------------------------------------------------- redirects */

export const listRedirects = () => request('/redirects');
export const createRedirect = (payload) => request('/redirects', { method: 'POST', body: payload });
export const updateRedirect = (id, payload) =>
  request(`/redirects/${encodeURIComponent(id)}`, { method: 'PUT', body: payload });
export const deleteRedirect = (id) =>
  request(`/redirects/${encodeURIComponent(id)}`, { method: 'DELETE' });

/* ---------------------------------------------------------------- 404 log */

/**
 * List logged misses.
 * @param {boolean} [unresolvedOnly=false] - Hide paths that already have a redirect.
 */
export const listNotFound = (unresolvedOnly = false) =>
  request(`/not-found${unresolvedOnly ? '?unresolvedOnly=true' : ''}`);
export const deleteNotFound = (id) =>
  request(`/not-found/${encodeURIComponent(id)}`, { method: 'DELETE' });
export const clearNotFound = () => request('/not-found/clear', { method: 'POST' });

/* ------------------------------------------------------------------- PSEO */

export const listPseoTemplates = () => request('/pseo/templates');
export const createPseoTemplate = (payload) =>
  request('/pseo/templates', { method: 'POST', body: payload });
export const updatePseoTemplate = (id, payload) =>
  request(`/pseo/templates/${encodeURIComponent(id)}`, { method: 'PUT', body: payload });
export const deletePseoTemplate = (id) =>
  request(`/pseo/templates/${encodeURIComponent(id)}`, { method: 'DELETE' });
export const previewPseoTemplate = (id) =>
  request(`/pseo/templates/${encodeURIComponent(id)}/preview`, { method: 'POST' });
export const generatePseoPages = (id) =>
  request(`/pseo/templates/${encodeURIComponent(id)}/generate`, { method: 'POST' });

export const listPseoPages = (params = {}) => {
  const search = new URLSearchParams();
  if (params.templateId) search.set('templateId', params.templateId);
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  const query = search.toString() ? `?${search.toString()}` : '';
  return request(`/pseo/pages${query}`);
};
export const updatePseoPage = (id, payload) =>
  request(`/pseo/pages/${encodeURIComponent(id)}`, { method: 'PUT', body: payload });
export const deletePseoPage = (id) =>
  request(`/pseo/pages/${encodeURIComponent(id)}`, { method: 'DELETE' });

/**
 * Look up a generated landing page by its path. Public: no auth, and a missing
 * page resolves to null rather than throwing, so the caller can fall through to
 * the not-found screen.
 *
 * @param {string} path - Site-relative path, e.g. "/maths-tutors-london".
 * @returns {Promise<Object|null>}
 */
export const getPseoPage = async (path) => {
  const response = await fetch(
    `${API_BASE_URL}/public/pseo?path=${encodeURIComponent(path)}`,
    { headers: { 'Content-Type': 'application/json' } },
  );
  if (!response.ok) return null;
  const data = await response.json();
  return data?.page || null;
};
