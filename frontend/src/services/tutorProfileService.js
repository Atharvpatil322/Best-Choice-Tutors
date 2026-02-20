/**
 * Tutor Profile Service
 * API layer for tutor profile operations
 * Mirrors learnerProfileService but for tutors.
 */

import { getAuthToken } from "./authService.js";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

/**
 * Get authenticated tutor's profile
 * GET /api/tutor/profile
 * @returns {Promise<Object>} Tutor profile data (and optionally user/availability)
 */
export const getTutorProfile = async () => {
  const token = getAuthToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_BASE_URL}/tutor/profile`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch tutor profile");
  }

  return data;
};

/**
 * Lightweight check: does the tutor have a Tutor profile document?
 * GET /api/tutor/profile/status — for sidebar "complete your profile" indicator.
 * @returns {Promise<{ hasProfile: boolean }>}
 */
export const getTutorProfileStatus = async () => {
  const token = getAuthToken();
  if (!token) return { hasProfile: false };
  const response = await fetch(`${API_BASE_URL}/tutor/profile/status`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  if (!response.ok) return { hasProfile: false, profilePhoto: null };
  return {
    hasProfile: !!data.hasProfile,
    profilePhoto: data.profilePhoto ?? null,
  };
};

/**
 * Get notifications for the authenticated tutor (API-based; no socket required).
 * GET /api/tutor/notifications
 * @returns {Promise<{ notifications: Array, unreadCount: number }>}
 */
export const getNotifications = async () => {
  const token = getAuthToken();
  if (!token) return { notifications: [], unreadCount: 0 };
  const response = await fetch(`${API_BASE_URL}/tutor/notifications`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to fetch notifications");
  return { notifications: data.notifications || [], unreadCount: data.unreadCount ?? 0 };
};

/**
 * Mark all notifications as read. PATCH /api/tutor/notifications/read-all
 */
export const markAllNotificationsRead = async () => {
  const token = getAuthToken();
  if (!token) return;
  await fetch(`${API_BASE_URL}/tutor/notifications/read-all`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

/**
 * Update authenticated tutor's profile
 * PUT /api/tutor/profile
 * Allows updating bio, experienceYears, qualifications, phone, profilePhoto,
 * subjects, hourlyRate, mode, location.
 * Availability rules/exceptions are managed via dedicated availability APIs and
 * are not sent from this service.
 *
 * @param {Object} profileData - { bio?, experienceYears?, qualifications?, phone?, profilePhoto? (File), subjects?, hourlyRate?, mode?, location? }
 * @returns {Promise<Object>} Updated profile data
 */
export const updateTutorProfile = async (profileData) => {
  const token = getAuthToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const formData = new FormData();

  if (profileData.bio !== undefined) {
    formData.append("bio", profileData.bio);
  }

  if (profileData.experienceYears !== undefined) {
    formData.append("experienceYears", String(profileData.experienceYears));
  }

  if (profileData.qualifications !== undefined) {
    formData.append(
      "qualifications",
      JSON.stringify(profileData.qualifications),
    );
  }

  if (profileData.phone !== undefined) {
    // Send structured phone object as JSON string
    formData.append("phone", JSON.stringify(profileData.phone || {}));
  }

  if (profileData.gender !== undefined && (profileData.gender === "MALE" || profileData.gender === "FEMALE")) {
    formData.append("gender", profileData.gender);
  }

  if (
    profileData.subjects !== undefined &&
    Array.isArray(profileData.subjects)
  ) {
    formData.append("subjects", JSON.stringify(profileData.subjects));
  }

  if (profileData.hourlyRate !== undefined && profileData.hourlyRate !== "") {
    formData.append("hourlyRate", String(profileData.hourlyRate));
  }

  if (profileData.mode !== undefined && profileData.mode !== "") {
    formData.append("mode", profileData.mode);
  }

  if (profileData.location !== undefined) {
    formData.append("location", String(profileData.location ?? ""));
  }

  if (profileData.profilePhoto instanceof File) {
    formData.append("profilePhoto", profileData.profilePhoto);
  }

  if (profileData.clearProfilePhoto === true) {
    formData.append("clearProfilePhoto", "1");
  }

  const response = await fetch(`${API_BASE_URL}/tutor/profile`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
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
        validationErrors[error.path || error.param] =
          error.msg || error.message;
      });
      const errorObj = {
        message: data.message || "Validation failed",
        errors: validationErrors,
      };
      throw errorObj;
    }
    throw new Error(data.message || "Failed to update tutor profile");
  }

  return data;
};
