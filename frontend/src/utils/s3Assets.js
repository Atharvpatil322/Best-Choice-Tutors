const RAW_ASSET_BASE_URL = import.meta.env.VITE_ASSET_BASE_URL || '';
const RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const RAW_S3_BASE_URL = import.meta.env.VITE_S3_BASE_URL || '';

const ASSET_BASE_URL = RAW_ASSET_BASE_URL
  ? RAW_ASSET_BASE_URL.replace(/\/+$/, '')
  : RAW_API_BASE_URL
    ? `${RAW_API_BASE_URL.replace(/\/+$/, '')}/public/assets`
    : RAW_S3_BASE_URL.replace(/\/+$/, '');

let warnedMissingBase = false;

function warnMissingS3BaseOnce() {
  if (import.meta.env.PROD || warnedMissingBase) return;
  warnedMissingBase = true;
  console.warn(
    "[s3Assets] No asset base URL configured. Image URLs fall back to site-relative paths (e.g. /images/...) " +
      "which will 404 unless those files exist under frontend/public/. " +
      "Set VITE_ASSET_BASE_URL (recommended for private S3) or VITE_API_BASE_URL (auto uses /public/assets). " +
      "Legacy: VITE_S3_BASE_URL for public buckets. See frontend/.env.example and restart the dev server."
  );
}

export function s3ImageUrl(path) {
  if (!path) return '';
  if (!ASSET_BASE_URL) {
    warnMissingS3BaseOnce();
    return path;
  }
  const cleanPath = path.replace(/^\/+/, '');
  return `${ASSET_BASE_URL}/${encodeURI(cleanPath)}`;
}
