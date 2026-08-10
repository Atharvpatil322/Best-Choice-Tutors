/**
 * Popular Search Service
 * Public and admin popular search keywords API calls.
 */

import { getAuthToken } from "./authService.js";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const parseJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

const requestJson = async (paths, options, fallbackMessage) => {
  const candidates = Array.isArray(paths) ? paths : [paths];
  let lastData = null;

  for (const path of candidates) {
    const response = await fetch(`${API_BASE_URL}${path}`, options);
    const data = await parseJson(response);

    if (response.ok) return data;

    lastData = data;
    if (response.status !== 404 || data.message !== "Route not found") {
      throw new Error(data.message || fallbackMessage);
    }
  }

  throw new Error(lastData?.message || fallbackMessage);
};

/**
 * Get active popular searches (public)
 * GET /api/popular-searches
 * @returns {Promise<{ popularSearches: Array }>}
 */
export const getActivePopularSearches = async () => {
  return requestJson("/popular-searches", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  }, "Failed to fetch popular searches");
};

/**
 * Get all popular searches (admin only)
 * GET /api/admin/popular-searches?page=1&limit=50&isActive=true
 * @param {Object} [params] - Query params: page, limit, isActive
 * @returns {Promise<{ popularSearches: Array, pagination: Object }>}
 */
export const getAllPopularSearchesAdmin = async (params = {}) => {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");

  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.isActive) search.set("isActive", params.isActive);
  const query = search.toString() ? `?${search.toString()}` : "";

  return requestJson([`/admin/popular-searches${query}`, `/admin/popular-search${query}`], {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  }, "Failed to fetch popular searches");
};

/**
 * Create a popular search (admin only)
 * POST /api/admin/popular-searches
 * @param {Object} searchData - { label, query, order?, isActive? }
 * @returns {Promise<{ message: string, popularSearch: Object }>}
 */
export const createPopularSearchAdmin = async (searchData) => {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");

  return requestJson(["/admin/popular-searches", "/admin/popular-search"], {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(searchData),
  }, "Failed to create popular search");
};

/**
 * Update a popular search (admin only)
 * PUT /api/admin/popular-searches/:id
 * @param {string} id
 * @param {Object} searchData
 * @returns {Promise<{ message: string, popularSearch: Object }>}
 */
export const updatePopularSearchAdmin = async (id, searchData) => {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");

  const encodedId = encodeURIComponent(id);
  return requestJson([
    `/admin/popular-searches/${encodedId}`,
    `/admin/popular-search/${encodedId}`,
  ], {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(searchData),
  }, "Failed to update popular search");
};

/**
 * Delete a popular search (admin only)
 * DELETE /api/admin/popular-searches/:id
 * @param {string} id
 * @returns {Promise<{ message: string }>}
 */
export const deletePopularSearchAdmin = async (id) => {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");

  const encodedId = encodeURIComponent(id);
  return requestJson([
    `/admin/popular-searches/${encodedId}`,
    `/admin/popular-search/${encodedId}`,
  ], {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  }, "Failed to delete popular search");
};
