/**
 * Tutor Profile Service
 * API layer for tutor profile operations
 * Mirrors learnerProfileService but for tutors.
 */

import { getAuthToken } from './authService.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Get authenticated tutor's profile
 * GET /api/tutor/profile
 * @returns {Promise<Object>} Tutor profile data (and optionally user/availability)
 */
export const getTutorProfile = async () => {
  const token = getAuthToken();

  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/tutor/profile`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch tutor profile');
  }

  return data;
};

/**
 * Update authenticated tutor's profile
 * PUT /api/tutor/profile
 * Allows updating bio, phone, and profilePhoto.
 * Availability rules/exceptions are managed via dedicated availability APIs and
 * are not sent from this service.
 *
 * @param {Object} profileData - { bio?, experienceYears?, qualifications?, phone?, profilePhoto? (File) }
 * @returns {Promise<Object>} Updated profile data
 */
export const updateTutorProfile = async (profileData) => {
  const token = getAuthToken();

  if (!token) {
    throw new Error('Authentication required');
  }

  const formData = new FormData();

  if (profileData.bio !== undefined) {
    formData.append('bio', profileData.bio);
  }

  if (profileData.experienceYears !== undefined) {
    formData.append('experienceYears', String(profileData.experienceYears));
  }

  if (profileData.qualifications !== undefined) {
    formData.append('qualifications', JSON.stringify(profileData.qualifications));
  }

  if (profileData.phone !== undefined) {
    // Send structured phone object as JSON string
    formData.append('phone', JSON.stringify(profileData.phone || {}));
  }

  if (profileData.profilePhoto instanceof File) {
    formData.append('profilePhoto', profileData.profilePhoto);
  }

  const response = await fetch(`${API_BASE_URL}/tutor/profile`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      // Do not set Content-Type; browser will set multipart boundary.
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    // Surface validation errors if present
    if (response.status === 400 && data.errors) {
      const validationErrors = {};
      data.errors.forEach((error) => {
        validationErrors[error.path || error.param] = error.msg || error.message;
      });
      const errorObj = { message: data.message || 'Validation failed', errors: validationErrors };
      throw errorObj;
    }
    throw new Error(data.message || 'Failed to update tutor profile');
  }

  return data;
};

