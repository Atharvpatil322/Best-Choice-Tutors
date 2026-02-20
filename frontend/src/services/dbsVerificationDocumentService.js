/**
 * DBS Verification Documents Service
 * List and upload DBS certificates (tutor only).
 */

import { getAuthToken } from './authService.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Get authenticated tutor's DBS documents
 * GET /api/tutor/dbs-documents
 * @returns {Promise<{ tutorId: string, count: number, documents: Array }>}
 */
export const getMyDbsDocuments = async () => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const response = await fetch(`${API_BASE_URL}/tutor/dbs-documents`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch DBS documents');
  return data;
};

/**
 * Upload a single DBS certificate (PDF or image)
 * POST /api/tutor/dbs-documents
 * @param {File} file - PDF or image file
 * @returns {Promise<{ message: string, document: Object }>}
 */
export const uploadDbsDocument = async (file) => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const formData = new FormData();
  formData.append('document', file);
  const response = await fetch(`${API_BASE_URL}/tutor/dbs-documents`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to upload DBS document');
  return data;
};
