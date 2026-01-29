/**
 * Tutor Bookings Service
 * API layer for tutor bookings (read-only list).
 */

import { getAuthToken } from './authService.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Get authenticated tutor's bookings
 * @returns {Promise<Object>} { bookings: [{ id, learnerName, date, startTime, endTime, status }] }
 */
export const getTutorBookings = async () => {
  const token = getAuthToken();

  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/tutor/bookings`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch bookings');
  }

  return data;
};

/**
 * Get a single tutor booking by id (for detail screen)
 * @param {string} bookingId
 * @returns {Promise<Object>} { id, learnerName, learnerEmail, date, startTime, endTime, status }
 */
export const getTutorBooking = async (bookingId) => {
  const token = getAuthToken();

  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/tutor/bookings/${bookingId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch booking');
  }

  return data;
};
