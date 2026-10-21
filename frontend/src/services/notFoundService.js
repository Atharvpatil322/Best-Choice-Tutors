/**
 * Missing-page reports
 *
 * The live site is static, so the server never sees a visit to an address
 * that does not exist. The "page not found" screen reports it here instead,
 * which is what fills the 404 log in the admin SEO tools.
 */

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/+$/, '');

/** Paths already reported during this page load, so a re-render is not counted twice. */
const reported = new Set();

/**
 * Report a visit to a missing page. Never throws: reporting must not affect
 * what the visitor sees.
 *
 * @param {string} path
 */
export function reportNotFound(path) {
  if (!path || reported.has(path)) return;
  reported.add(path);
  try {
    fetch(`${API_BASE_URL}/public/not-found`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, referrer: document.referrer || '' }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* reporting is best effort */
  }
}
