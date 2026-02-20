/**
 * Availability Service
 * API layer for tutor availability operations
 * UI task: Tutor availability management
 */

import { getAuthToken } from './authService.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Get tutor's own availability
 * @returns {Promise<Object>} Availability data
 */
export const getMyAvailability = async () => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/tutors/me/availability`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    // Handle 404 as availability not found (not an error for new tutors)
    if (response.status === 404) {
      return { availability: null };
    }
    throw new Error(data.message || 'Failed to fetch availability');
  }

  return data;
};

/**
 * Create tutor availability
 * @param {Object} availabilityData - { timezone, weeklyRules, exceptions }
 * @returns {Promise<Object>} Created availability data
 */
export const createAvailability = async (availabilityData) => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/tutors/me/availability`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(availabilityData),
  });

  const data = await response.json();

  if (!response.ok) {
    // Handle validation errors
    if (response.status === 400 && data.errors) {
      const validationErrors = {};
      // express-validator errors array format: [{ msg, param, ... }]
      data.errors.forEach((error) => {
        const key = error.path || error.param || error.field || 'unknown';
        validationErrors[key] = error.msg || error.message || 'Validation error';
      });
      const errorObj = { message: data.message || 'Validation failed', errors: validationErrors };
      // Also include raw errors for debugging
      errorObj.rawErrors = data.errors;
      throw errorObj;
    }
    throw new Error(data.message || 'Failed to create availability');
  }

  return data;
};

/**
 * Update tutor availability
 * @param {Object} availabilityData - { timezone, weeklyRules, exceptions }
 * @returns {Promise<Object>} Updated availability data
 */
export const updateAvailability = async (availabilityData) => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/tutors/me/availability`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(availabilityData),
  });

  const data = await response.json();

  if (!response.ok) {
    // Handle validation errors
    if (response.status === 400 && data.errors) {
      const validationErrors = {};
      // express-validator errors array format: [{ msg, param, ... }]
      data.errors.forEach((error) => {
        const key = error.path || error.param || error.field || 'unknown';
        validationErrors[key] = error.msg || error.message || 'Validation error';
      });
      const errorObj = { message: data.message || 'Validation failed', errors: validationErrors };
      // Also include raw errors for debugging
      errorObj.rawErrors = data.errors;
      throw errorObj;
    }
    throw new Error(data.message || 'Failed to update availability');
  }

  return data;
};
