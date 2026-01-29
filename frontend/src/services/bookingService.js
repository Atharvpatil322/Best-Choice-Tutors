import { getAuthToken } from './authService.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Create a booking for a slot
 * Calls backend: POST /api/bookings
 *
 * @param {Object} params
 * @param {string} params.tutorId - Tutor ID
 * @param {string} params.date - YYYY-MM-DD
 * @param {string} params.startTime - HH:mm
 * @param {string} params.endTime - HH:mm
 * @returns {Promise<Object>} { message, booking: { id, ... } }
 */
export const createBooking = async ({ tutorId, date, startTime, endTime }) => {
  const token = getAuthToken();

  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/bookings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tutorId, date, startTime, endTime }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create booking');
  }

  return data;
};
