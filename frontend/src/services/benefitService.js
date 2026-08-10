/**
 * Benefit Service
 * Public and admin "Why Choose Us" benefit API calls.
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
 * Get active benefits (public)
 * GET /api/benefits
 * @returns {Promise<{ benefits: Array }>}
 */
export const getActiveBenefits = async () => {
  return requestJson("/benefits", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  }, "Failed to fetch benefits");
};

/**
 * Get all benefits (admin only)
 * GET /api/admin/benefits?page=1&limit=50&isActive=true
 * @param {Object} [params] - Query params: page, limit, isActive
 * @returns {Promise<{ benefits: Array, pagination: Object, maxActive: number }>}
 */
export const getAllBenefitsAdmin = async (params = {}) => {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");

  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.isActive) search.set("isActive", params.isActive);
  const query = search.toString() ? `?${search.toString()}` : "";

  return requestJson([`/admin/benefits${query}`, `/admin/why-choose-us${query}`, `/admin/benefit${query}`], {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  }, "Failed to fetch benefits");
};

/**
 * Create a benefit (admin only)
 * POST /api/admin/benefits
 * @param {Object} benefitData - { title, description, icon?, order?, isActive? }
 * @returns {Promise<{ message: string, benefit: Object }>}
 */
export const createBenefitAdmin = async (benefitData) => {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");

  return requestJson(["/admin/benefits", "/admin/why-choose-us", "/admin/benefit"], {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(benefitData),
  }, "Failed to create benefit");
};

/**
 * Update a benefit (admin only)
 * PUT /api/admin/benefits/:id
 * @param {string} id
 * @param {Object} benefitData
 * @returns {Promise<{ message: string, benefit: Object }>}
 */
export const updateBenefitAdmin = async (id, benefitData) => {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");

  const encodedId = encodeURIComponent(id);
  return requestJson([
    `/admin/benefits/${encodedId}`,
    `/admin/why-choose-us/${encodedId}`,
    `/admin/benefit/${encodedId}`,
  ], {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(benefitData),
  }, "Failed to update benefit");
};

/**
 * Delete a benefit (admin only)
 * DELETE /api/admin/benefits/:id
 * @param {string} id
 * @returns {Promise<{ message: string }>}
 */
export const deleteBenefitAdmin = async (id) => {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");

  const encodedId = encodeURIComponent(id);
  return requestJson([
    `/admin/benefits/${encodedId}`,
    `/admin/why-choose-us/${encodedId}`,
    `/admin/benefit/${encodedId}`,
  ], {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  }, "Failed to delete benefit");
};
