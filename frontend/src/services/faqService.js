/**
 * FAQ Service
 * Public and admin FAQ API calls.
 */

import { getAuthToken } from "./authService.js";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/+$/, "");

function buildApiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return API_BASE_URL.endsWith("/api")
    ? `${API_BASE_URL}${normalizedPath}`
    : `${API_BASE_URL}/api${normalizedPath}`;
}

/**
 * Get active FAQs (public)
 * GET /api/faq?subject=English
 *
 * Without a subject this returns the general set shown on the home page and the
 * unfiltered tutor search. With one it returns only that subject's own FAQs,
 * which may be an empty list - the two sets are never mixed.
 *
 * @param {string} [subject] - Canonical subject name, e.g. "English".
 * @returns {Promise<{ faqs: Array, subject: string|null }>}
 */
export const getActiveFaqs = async (subject) => {
  const query = subject ? `?subject=${encodeURIComponent(subject)}` : "";
  const response = await fetch(buildApiUrl(`/faq${query}`), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to fetch FAQs");
  return data;
};

/**
 * Get all FAQs (admin only)
 * GET /api/admin/faq?page=1&limit=50&isActive=true&subject=English
 * @param {Object} [params] - Query params: page, limit, isActive, subject
 *   (`subject` takes a canonical name, or "general" for untagged entries)
 * @returns {Promise<{ faqs: Array, pagination: Object }>}
 */
export const getAllFaqsAdmin = async (params = {}) => {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");

  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.isActive) search.set("isActive", params.isActive);
  if (params.subject) search.set("subject", params.subject);
  const query = search.toString() ? `?${search.toString()}` : "";

  const response = await fetch(buildApiUrl(`/admin/faq${query}`), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to fetch FAQs");
  return data;
};

/**
 * Create a FAQ (admin only)
 * POST /api/admin/faq
 * @param {Object} faqData - { question, answer, order?, isActive? }
 * @returns {Promise<{ message: string, faq: Object }>}
 */
export const createFaqAdmin = async (faqData) => {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");

  const response = await fetch(buildApiUrl("/admin/faq"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(faqData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to create FAQ");
  return data;
};

/**
 * Update a FAQ (admin only)
 * PUT /api/admin/faq/:id
 * @param {string} id
 * @param {Object} faqData
 * @returns {Promise<{ message: string, faq: Object }>}
 */
export const updateFaqAdmin = async (id, faqData) => {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");

  const response = await fetch(buildApiUrl(`/admin/faq/${encodeURIComponent(id)}`), {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(faqData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to update FAQ");
  return data;
};

/**
 * Delete a FAQ (admin only)
 * DELETE /api/admin/faq/:id
 * @param {string} id
 * @returns {Promise<{ message: string }>}
 */
export const deleteFaqAdmin = async (id) => {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");

  const response = await fetch(buildApiUrl(`/admin/faq/${encodeURIComponent(id)}`), {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to delete FAQ");
  return data;
};

