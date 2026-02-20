/**
 * Tutor Verification Documents Service
 * List and upload qualification certificates (tutor only).
 */

import { getAuthToken } from './authService.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Get authenticated tutor's verification documents
 * GET /api/tutor/verification-documents
 * @returns {Promise<{ tutorId: string, count: number, documents: Array }>}
 */
export const getMyVerificationDocuments = async () => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const response = await fetch(`${API_BASE_URL}/tutor/verification-documents`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch documents');
  return data;
};

/**
 * Upload a single verification document (PDF or image)
 * POST /api/tutor/verification-documents
 * @param {File} file - PDF or image file
 * @returns {Promise<{ message: string, document: Object }>}
 */
export const uploadVerificationDocument = async (file) => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const formData = new FormData();
  formData.append('document', file);
  const response = await fetch(`${API_BASE_URL}/tutor/verification-documents`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to upload document');
  return data;
};
