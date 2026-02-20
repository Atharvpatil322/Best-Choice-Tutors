/**
 * Tutor Service
 * API layer for tutor operations
 * Phase 3.2: Tutor profile creation
 * Phase 3.3: Tutor profile view
 * Phase 3.4: Tutor listing
 * With basic in-memory caching
 */

import { getAuthToken } from "./authService.js";
import {
  getCache,
  setCache,
  getTutorListCacheKey,
  getTutorProfileCacheKey,
  getTutorAvailabilityCacheKey,
  getTutorSlotsCacheKey,
} from "@/utils/cache.js";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

/**
 * Create tutor profile
 * Phase 3.2: Submit tutor profile creation
 * @param {Object} tutorData - { fullName, bio, subjects, qualifications: [{ title, institution, year }], experienceYears, hourlyRate, mode, location?, profilePhoto? (File) }
 * @returns {Promise<Object>} Created tutor profile data
 */
export const createTutorProfile = async (tutorData) => {
  const token = getAuthToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const formData = new FormData();

  formData.append("fullName", tutorData.fullName);
  formData.append("bio", tutorData.bio);

  // Subjects as array - send each subject individually
  if (Array.isArray(tutorData.subjects) && tutorData.subjects.length > 0) {
    tutorData.subjects.forEach((subject) => {
      formData.append("subjects", subject);
    });
  } else if (tutorData.subjects) {
    formData.append("subjects", tutorData.subjects);
  }

  formData.append(
    "qualifications",
    JSON.stringify(tutorData.qualifications || []),
  );
  const expYears = tutorData.experienceYears;
  formData.append(
    "experienceYears",
    Number.isInteger(expYears) && expYears >= 0 ? String(expYears) : "0",
  );
  formData.append("hourlyRate", tutorData.hourlyRate.toString());
  formData.append("mode", tutorData.mode);

  if (tutorData.location) {
    formData.append("location", tutorData.location);
  }

  if (tutorData.profilePhoto instanceof File) {
    formData.append("profilePhoto", tutorData.profilePhoto);
  }

  const response = await fetch(`${API_BASE_URL}/tutors`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
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
        validationErrors[error.path || error.param] =
          error.msg || error.message;
      });
      throw {
        message: data.message || "Validation failed",
        errors: validationErrors,
      };
    }
    throw new Error(data.message || "Failed to create tutor profile");
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
  // Check cache first
  const cacheKey = getTutorProfileCacheKey(tutorId);
  const cached = getCache(cacheKey);
  if (cached) {
    return cached;
  }

  const response = await fetch(`${API_BASE_URL}/tutors/${tutorId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch tutor profile");
  }

  // Cache the response
  setCache(cacheKey, data);

  return data;
};

/**
 * Get all tutors (public)
 * Fetch tutors with optional filtering, pagination, and location-based proximity.
 * @param {Object} filters - Filter options { subject, mode, priceMin, priceMax, gender, page, limit, lat, lng, distance }
 * @returns {Promise<Object>} { tutors: [], pagination: { page, limit, totalCount, totalPages } }
 */
export const getAllTutors = async (filters = {}) => {
  const {
    subject,
    mode,
    priceMin,
    priceMax,
    gender,
    page = 1,
    limit = 12,
    lat,
    lng,
    distance = 10,
  } = filters;

  // Build query string
  const params = new URLSearchParams();
  if (subject) params.append("subject", subject);
  if (mode) params.append("mode", mode);
  if (priceMin) params.append("priceMin", priceMin);
  if (priceMax) params.append("priceMax", priceMax);
  if (gender) params.append("gender", gender);
  // Location-based discovery (optional; uses Browser Geolocation, not stored)
  if (lat != null && lng != null) {
    params.append("lat", String(lat));
    params.append("lng", String(lng));
    params.append("distance", String(distance));
  }
  params.append("page", page.toString());
  params.append("limit", limit.toString());

  const queryString = params.toString();
  const url = `${API_BASE_URL}/tutors${queryString ? `?${queryString}` : ""}`;

  // Don't cache filtered/paginated results
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch tutors");
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
  // Check cache first
  const cacheKey = getTutorAvailabilityCacheKey(tutorId);
  const cached = getCache(cacheKey);
  if (cached) {
    return cached;
  }

  const response = await fetch(
    `${API_BASE_URL}/tutors/${tutorId}/availability`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch tutor availability");
  }

  // Cache the response
  setCache(cacheKey, data);

  return data;
};

/**
 * Get time slots for a tutor (public)
 * UI task: Fetch generated slots for tutor profile view
 * Backend generates and deduplicates slots deterministically
 * @param {string} tutorId - Tutor ID
 * @param {string} fromDate - Start date in YYYY-MM-DD format
 * @param {string} toDate - End date in YYYY-MM-DD format
 * @returns {Promise<Object>} { slots: [{ date, startTime, endTime }] }
 */
export const getTutorSlots = async (tutorId, fromDate, toDate) => {
  // Validate required parameters
  if (!tutorId) {
    throw new Error("Tutor ID is required");
  }

  if (!fromDate || !toDate) {
    throw new Error("Both from and to dates are required (format: YYYY-MM-DD)");
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(fromDate) || !dateRegex.test(toDate)) {
    throw new Error("Dates must be in YYYY-MM-DD format");
  }

  // Removed caching to ensure fresh, deterministic slots on every request
  // Backend handles deduplication and filtering

  const response = await fetch(
    `${API_BASE_URL}/tutors/${tutorId}/slots?from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    // Handle 400/500 errors gracefully
    const errorMessage =
      data.message || `Failed to fetch tutor slots (${response.status})`;
    throw new Error(errorMessage);
  }

  // Return slots directly - backend has already filtered past slots and sorted
  return data;
};
