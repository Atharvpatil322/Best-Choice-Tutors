const RAW_BASE_URL = import.meta.env.VITE_S3_BASE_URL || '';
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');

let warnedMissingBase = false;

function warnMissingS3BaseOnce() {
  if (import.meta.env.PROD || warnedMissingBase) return;
  warnedMissingBase = true;
  console.warn(
    "[s3Assets] VITE_S3_BASE_URL is not set. Image URLs fall back to site-relative paths (e.g. /images/...) " +
      "which will 404 unless those files exist under frontend/public/. " +
      "Add VITE_S3_BASE_URL to frontend/.env (see frontend/.env.example) and restart the dev server."
  );
}

export function s3ImageUrl(path) {
  if (!path) return '';
  if (!BASE_URL) {
    warnMissingS3BaseOnce();
    return path;
  }
  const cleanPath = path.replace(/^\/+/, '');
  return `${BASE_URL}/${encodeURI(cleanPath)}`;
}
