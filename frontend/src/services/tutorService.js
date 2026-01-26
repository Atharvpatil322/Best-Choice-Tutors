/**
 * Tutor Service
 * API layer for tutor operations
 * Phase 3.2: Tutor profile creation
 * Phase 3.3: Tutor profile view
 * Phase 3.4: Tutor listing
 */

import { getAuthToken } from './authService.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Create tutor profile
 * Phase 3.2: Submit tutor profile creation
 * @param {Object} tutorData - { fullName, bio, subjects, education, experienceYears, hourlyRate, mode, location?, profilePhoto? (File) }
 * @returns {Promise<Object>} Created tutor profile data
 */
export const createTutorProfile = async (tutorData) => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }

  const formData = new FormData();
  
  formData.append('fullName', tutorData.fullName);
  formData.append('bio', tutorData.bio);
  
  // Subjects as array - send each subject individually
  if (Array.isArray(tutorData.subjects) && tutorData.subjects.length > 0) {
    tutorData.subjects.forEach((subject) => {
      formData.append('subjects', subject);
    });
  } else if (tutorData.subjects) {
    formData.append('subjects', tutorData.subjects);
  }
  
  formData.append('education', tutorData.education);
  formData.append('experienceYears', tutorData.experienceYears.toString());
  formData.append('hourlyRate', tutorData.hourlyRate.toString());
  formData.append('mode', tutorData.mode);
  
  if (tutorData.location) {
    formData.append('location', tutorData.location);
  }
  
  if (tutorData.profilePhoto instanceof File) {
    formData.append('profilePhoto', tutorData.profilePhoto);
  }

  const response = await fetch(`${API_BASE_URL}/tutors`, {
    method: 'POST',
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
    throw new Error(data.message || 'Failed to create tutor profile');
  }

  return data;
};

/**
 * Get tutor by ID (public)
 * Phase 3.3: Fetch tutor profile for viewing
 * @param {string} tutorId - Tutor ID
 * @returns {Promise<Object>} Tutor profile data
 */
export const getTutorById = async (tutorId) => {
  const response = await fetch(`${API_BASE_URL}/tutors/${tutorId}`, {
    method: 'GET',
    headers: {
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
 * Get all tutors (public)
 * Phase 3.4: Fetch all tutors for listing
 * @returns {Promise<Object>} { tutors: [], count: number }
 */
export const getAllTutors = async () => {
  const response = await fetch(`${API_BASE_URL}/tutors`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch tutors');
  }

  return data;
};

/**
 * Get public availability for a tutor (public)
 * UI task: Fetch availability rules for tutor profile view
 * @param {string} tutorId - Tutor ID
 * @returns {Promise<Object>} { availability: { timezone, weeklyRules, exceptions } }
 */
export const getTutorAvailability = async (tutorId) => {
  const response = await fetch(`${API_BASE_URL}/tutors/${tutorId}/availability`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch tutor availability');
  }

  return data;
};

/**
 * Get time slots for a tutor (public)
 * UI task: Fetch generated slots for tutor profile view
 * @param {string} tutorId - Tutor ID
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<Object>} { slots: [{ date, startTime, endTime }] }
 */
export const getTutorSlots = async (tutorId, startDate, endDate) => {
  const response = await fetch(
    `${API_BASE_URL}/tutors/${tutorId}/slots?startDate=${startDate}&endDate=${endDate}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch tutor slots');
  }

  return data;
};
