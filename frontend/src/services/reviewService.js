/**
 * Review Service (Phase 8)
 * Submit review for a completed booking. Learner-only.
 */

import { getAuthToken } from './authService.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Submit a review for a booking
 * POST /api/bookings/:bookingId/review
 * @param {string} bookingId - Booking ID
 * @param {Object} payload - { rating: number (1-5), reviewText?: string }
 * @returns {Promise<Object>} { message, review }
 */
export const submitReview = async (bookingId, { rating, reviewText }) => {
  const token = getAuthToken();

  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/review`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      rating: Number(rating),
      reviewText: typeof reviewText === 'string' ? reviewText.trim() : '',
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to submit review');
  }

  return data;
};

/**
 * Get reviews submitted by the authenticated learner
 * GET /api/learner/reviews
 * @returns {Promise<{ count: number, reviews: Array<{ id, bookingId, tutorId, tutorName, bookingDate, bookingStartTime, bookingEndTime, rating, reviewText, createdAt }> }>}
 */
export const getMySubmittedReviews = async () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/learner/reviews`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch your reviews');
  }

  return data;
};

/**
 * Get reviews received by the authenticated tutor
 * GET /api/tutor/reviews
 * @returns {Promise<{ count: number, reviews: Array<{ id, bookingId, tutorId, learnerId, rating, reviewText, createdAt, isReported }> }>}
 */
export const getMyReceivedReviews = async () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/tutor/reviews`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch reviews');
  }

  return data;
};

/**
 * Report a review (tutor only; only the tutor who received the review)
 * POST /api/tutor/reviews/:reviewId/report
 * @param {string} reviewId - Review ID
 * @param {string} [reportedReason] - Optional reason for reporting
 * @returns {Promise<Object>} { message, review }
 */
export const reportReview = async (reviewId, reportedReason) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/tutor/reviews/${reviewId}/report`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reportedReason: typeof reportedReason === 'string' ? reportedReason.trim() : '',
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to report review');
  }

  return data;
};
