/**
 * Dispute Service
 * Phase 10: Learner dispute initiation, evidence submission (learner & tutor)
 */

import { getAuthToken } from './authService.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Raise a dispute for a booking
 * POST /api/learner/bookings/:bookingId/dispute
 * @param {string} bookingId
 * @param {string} reason - Dispute reason text
 * @returns {Promise<{ dispute: Object }>}
 */
export const raiseDispute = async (bookingId, reason) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/learner/bookings/${bookingId}/dispute`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason: reason?.trim() || '' }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to raise dispute');
  }
  return data;
};

/**
 * Submit learner evidence for an OPEN dispute
 * PATCH /api/learner/bookings/:bookingId/dispute/evidence
 * @param {string} bookingId
 * @param {string} learnerEvidence - Evidence text
 * @returns {Promise<{ dispute: Object }>}
 */
export const submitLearnerEvidence = async (bookingId, learnerEvidence) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/learner/bookings/${bookingId}/dispute/evidence`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ learnerEvidence: learnerEvidence?.trim() || '' }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to submit evidence');
  }
  return data;
};

/**
 * Submit tutor evidence for an OPEN dispute
 * PATCH /api/tutor/bookings/:bookingId/dispute/evidence
 * @param {string} bookingId
 * @param {string} tutorEvidence - Evidence text
 * @returns {Promise<{ dispute: Object }>}
 */
export const submitTutorEvidence = async (bookingId, tutorEvidence) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/tutor/bookings/${bookingId}/dispute/evidence`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tutorEvidence: tutorEvidence?.trim() || '' }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to submit evidence');
  }
  return data;
};
