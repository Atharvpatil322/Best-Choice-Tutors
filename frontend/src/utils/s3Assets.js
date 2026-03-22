const RAW_BASE_URL = import.meta.env.VITE_S3_BASE_URL || '';
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');

export function s3ImageUrl(path) {
  if (!path) return '';
  if (!BASE_URL) return path;
  const cleanPath = path.replace(/^\/+/, '');
  return `${BASE_URL}/${encodeURI(cleanPath)}`;
}
