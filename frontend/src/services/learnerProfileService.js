/**
 * Learner Profile Service
 * API layer for learner profile operations
 * Handles all communication with backend learner profile endpoints
 */

import { getAuthToken } from './authService.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Get authenticated learner's profile
 * @returns {Promise<Object>} { name, email, profilePhoto, phoneNumber, learningPreferences }
 */
export const getLearnerProfile = async () => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/learner/profile`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch profile');
  }

  return data;
};

/**
 * Update authenticated learner's profile
 * FR-4.1.1, FR-4.1.2, UC-4.1, UC-4.2: Update basic details and learning preferences
 * @param {Object} profileData - { name?, phoneNumber?, profilePhoto? (File), gradeLevel?, subjectsOfInterest? (array) }
 * @returns {Promise<Object>} Updated profile data
 */
export const updateLearnerProfile = async (profileData) => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }

  const formData = new FormData();
  
  if (profileData.name !== undefined) {
    formData.append('name', profileData.name);
  }
  
  if (profileData.phoneNumber !== undefined) {
    formData.append('phoneNumber', profileData.phoneNumber || '');
  }
  
  if (profileData.profilePhoto instanceof File) {
    formData.append('profilePhoto', profileData.profilePhoto);
  }

  // Learning preferences (FR-4.1.2, UC-4.2)
  if (profileData.gradeLevel !== undefined) {
    formData.append('gradeLevel', profileData.gradeLevel || '');
  }

  if (profileData.subjectsOfInterest !== undefined) {
    // Send as JSON string for FormData (backend will parse it)
    formData.append('subjectsOfInterest', JSON.stringify(profileData.subjectsOfInterest || []));
  }

  const response = await fetch(`${API_BASE_URL}/learner/profile`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      // Don't set Content-Type header - browser will set it with boundary for FormData
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    // Handle validation errors
    if (response.status === 400 && data.errors) {
      const validationErrors = {};
      data.errors.forEach((error) => {
        validationErrors[error.path || error.param] = error.msg || error.message;
      });
      throw { message: data.message || 'Validation failed', errors: validationErrors };
    }
    throw new Error(data.message || 'Failed to update profile');
  }

  return data;
};
