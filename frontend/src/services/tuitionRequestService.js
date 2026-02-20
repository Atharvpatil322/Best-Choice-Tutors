/**
 * Tuition Request Service
 * API layer for learner tuition request operations (Phase 9: Reverse Discovery)
 */

import { getAuthToken } from './authService.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Create a tuition request (learners only)
 * @param {Object} data - { subjects: string[], budget, mode, description }
 * @returns {Promise<Object>} Created request { id, learnerId, subject, subjects, budget, mode, description, status, createdAt }
 */
export const createTuitionRequest = async (data) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/learner/tuition-requests`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subjects: Array.isArray(data.subjects) ? data.subjects : [data.subject].filter(Boolean),
      budget: data.budget,
      mode: data.mode,
      description: data.description,
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || result.errors?.[0]?.msg || 'Failed to create tuition request');
  }
  return result;
};

/**
 * List learner's own tuition requests
 * @returns {Promise<Object>} { requests: [{ id, subject, budget, mode, description, status, createdAt }] }
 */
export const getMyTuitionRequests = async () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/learner/tuition-requests`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch tuition requests');
  }
  return data;
};

/**
 * Withdraw a tuition request (learners only, must own and be ACTIVE).
 * @param {string} requestId - Tuition request ID
 * @returns {Promise<Object>} { id, status, message }
 */
export const withdrawTuitionRequest = async (requestId) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(
    `${API_BASE_URL}/learner/tuition-requests/${requestId}/withdraw`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to withdraw request');
  }
  return data;
};

/**
 * Get interested tutors for a learner's tuition request (learner must own request)
 * @param {string} requestId - Tuition request ID
 * @returns {Promise<Object>} { requestId, tutors: [{ tutorId, name, subjects, rating }] }
 */
export const getInterestedTutorsForRequest = async (requestId) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(
    `${API_BASE_URL}/learner/tuition-requests/${requestId}/interested-tutors`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch interested tutors');
  }
  return data;
};

/**
 * Get active tuition requests (verified tutors only)
 * @returns {Promise<Object>} { requests: [{ id, subject, budget, mode, description, status, createdAt }] }
 */
export const getActiveTuitionRequestsForTutor = async () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/tutor/tuition-requests`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch tuition requests');
  }
  return data;
};

/**
 * Express interest in a tuition request (verified tutors only)
 * @param {string} requestId - Tuition request ID
 * @returns {Promise<Object>} { id, requestId, tutorId, createdAt }
 */
export const expressInterest = async (requestId) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(
    `${API_BASE_URL}/tutor/tuition-requests/${requestId}/interest`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to express interest');
  }
  return data;
};
