/**
 * Admin Service
 * Read-only APIs for admin (e.g. reported reviews). No moderation actions.
 */

import { getAuthToken } from './authService.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Get reported reviews (admin only)
 * GET /api/admin/reported-reviews
 * @returns {Promise<{ count: number, reportedReviews: Array }>}
 */
export const getReportedReviews = async () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/admin/reported-reviews`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch reported reviews');
  }

  return data;
};

/**
 * Get disputes list (admin only)
 * GET /api/admin/disputes
 * @returns {Promise<{ disputes: Array }>}
 */
export const getDisputes = async () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/admin/disputes`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch disputes');
  }
  return data;
};

/**
 * Get dispute detail (admin only)
 * GET /api/admin/disputes/:disputeId
 * @param {string} disputeId
 * @returns {Promise<Object>}
 */
export const getDispute = async (disputeId) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/admin/disputes/${disputeId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch dispute');
  }
  return data;
};

/**
 * Resolve dispute (admin only)
 * PATCH /api/admin/disputes/:disputeId/resolve
 * @param {string} disputeId
 * @param {Object} body - { outcome, refundAmountInPaise? }
 * @returns {Promise<Object>}
 */
export const resolveDispute = async (disputeId, body) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/admin/disputes/${disputeId}/resolve`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to resolve dispute');
  }
  return data;
};
