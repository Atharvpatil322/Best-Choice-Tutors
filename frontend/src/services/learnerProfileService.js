/**
 * Learner Profile Service
 * API layer for learner profile operations
 * Handles all communication with backend learner profile endpoints
 */

import { getAuthToken } from './authService.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Get authenticated learner's profile
 * @returns {Promise<Object>} { name, email, profilePhoto, phone: { countryCode, number }, learningPreferences }
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
 * @param {Object} profileData - { name?, phone?: { countryCode?, number? }, profilePhoto? (File), gradeLevel?, subjectsOfInterest? (array) }
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
  
  if (profileData.phone !== undefined && profileData.phone && typeof profileData.phone === 'object') {
    formData.append('phone', JSON.stringify({
      countryCode: profileData.phone.countryCode ?? '',
      number: profileData.phone.number ?? '',
    }));
  }
  
  if (profileData.profilePhoto instanceof File) {
    formData.append('profilePhoto', profileData.profilePhoto);
  }

  if (profileData.clearProfilePhoto === true) {
    formData.append('clearProfilePhoto', '1');
  }

  // Learning preferences (FR-4.1.2, UC-4.2)
  if (profileData.gradeLevel !== undefined) {
    formData.append('gradeLevel', profileData.gradeLevel || '');
  }

  if (profileData.subjectsOfInterest !== undefined) {
    formData.append('subjectsOfInterest', JSON.stringify(profileData.subjectsOfInterest || []));
  }

  if (profileData.dob !== undefined && profileData.dob !== null && profileData.dob !== '') {
    formData.append('dob', profileData.dob);
  }
  if (profileData.gender !== undefined && (profileData.gender === 'MALE' || profileData.gender === 'FEMALE')) {
    formData.append('gender', profileData.gender);
  }
  if (profileData.preferredLanguage !== undefined) {
    formData.append('preferredLanguage', profileData.preferredLanguage || '');
  }
  if (profileData.address !== undefined) {
    formData.append('address', profileData.address || '');
  }
  if (profileData.instituteName !== undefined) {
    formData.append('instituteName', profileData.instituteName || '');
  }
  if (profileData.learningGoal !== undefined) {
    formData.append('learningGoal', profileData.learningGoal || '');
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
