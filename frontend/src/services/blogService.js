/**
 * Blog Service
 * Public and admin blog API calls.
 */

import { getAuthToken } from "./authService.js";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

/**
 * Get published blogs (public)
 * GET /api/blog?page=1&limit=12&category=...
 * @param {{ page?: number, limit?: number, category?: string }} [params]
 * @returns {Promise<{ blogs: Array, pagination: Object }>}
 */
export const getPublishedBlogs = async (params = {}) => {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.category) search.set("category", params.category);
  const query = search.toString() ? `?${search.toString()}` : "";

  const response = await fetch(`${API_BASE_URL}/blog${query}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to fetch blogs");
  return data;
};

/**
 * Get a single blog by slug (public)
 * GET /api/blog/:slug
 * @param {string} slug
 * @returns {Promise<{ blog: Object }>}
 */
export const getBlogBySlug = async (slug) => {
  const response = await fetch(`${API_BASE_URL}/blog/${encodeURIComponent(slug)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to fetch blog");
  return data;
};

/**
 * Get all blogs (admin only)
 * GET /api/admin/blog?page=1&limit=20&status=...
 * @param {{ page?: number, limit?: number, status?: string }} [params]
 * @returns {Promise<{ blogs: Array, pagination: Object }>}
 */
export const getAllBlogsAdmin = async (params = {}) => {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");

  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.status) search.set("status", params.status);
  const query = search.toString() ? `?${search.toString()}` : "";

  const response = await fetch(`${API_BASE_URL}/admin/blog${query}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to fetch blogs");
  return data;
};

/**
 * Get a single blog by ID (admin only)
 * GET /api/admin/blog/:id
 * @param {string} id
 * @returns {Promise<{ blog: Object }>}
 */
export const getBlogByIdAdmin = async (id) => {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");

  const response = await fetch(`${API_BASE_URL}/admin/blog/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to fetch blog");
  return data;
};

/**
 * Create a blog (admin only)
 * POST /api/admin/blog
 * @param {Object} blogData - { title, excerpt, content, author?, category?, imageUrl?, status? }
 * @returns {Promise<{ message: string, blog: Object }>}
 */
export const createBlogAdmin = async (blogData) => {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");

  const response = await fetch(`${API_BASE_URL}/admin/blog`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(blogData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to create blog");
  return data;
};

/**
 * Upload a blog image (admin only)
 * POST /api/admin/blog/upload-image
 * @param {File} image
 * @returns {Promise<{ message: string, imageUrl: string }>}
 */
export const uploadBlogImageAdmin = async (image) => {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");

  const formData = new FormData();
  formData.append("image", image);

  const response = await fetch(`${API_BASE_URL}/admin/blog/upload-image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to upload blog image");
  return data;
};

/**
 * Update a blog (admin only)
 * PUT /api/admin/blog/:id
 * @param {string} id
 * @param {Object} blogData
 * @returns {Promise<{ message: string, blog: Object }>}
 */
export const updateBlogAdmin = async (id, blogData) => {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");

  const response = await fetch(`${API_BASE_URL}/admin/blog/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(blogData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to update blog");
  return data;
};

/**
 * Delete a blog (admin only)
 * DELETE /api/admin/blog/:id
 * @param {string} id
 * @returns {Promise<{ message: string }>}
 */
export const deleteBlogAdmin = async (id) => {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");

  const response = await fetch(`${API_BASE_URL}/admin/blog/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to delete blog");
  return data;
};

