import { getAuthToken } from './authService.js';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/+$/, '');

function buildApiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return API_BASE_URL.endsWith('/api')
    ? `${API_BASE_URL}${normalizedPath}`
    : `${API_BASE_URL}/api${normalizedPath}`;
}

function parseResponse(response) {
  return response.json().then((data) => {
    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }
    return data;
  });
}

export const getSeoConfigs = async () => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const response = await fetch(buildApiUrl('/admin/seo'), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return parseResponse(response);
};

export const createSeoConfig = async (payload) => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const response = await fetch(buildApiUrl('/admin/seo'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
};

export const updateSeoConfig = async (id, payload) => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const response = await fetch(buildApiUrl(`/admin/seo/${encodeURIComponent(id)}`), {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
};

export const deleteSeoConfig = async (id) => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const response = await fetch(buildApiUrl(`/admin/seo/${encodeURIComponent(id)}`), {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return parseResponse(response);
};
