/**
 * Cache-Control middleware for public, read-only endpoints whose response is
 * the same for every visitor. Browsers reuse the response for `maxAge` seconds
 * and may serve a stale copy for `staleWhileRevalidate` more while refreshing.
 * Only attach this to unauthenticated GET routes.
 */
export function publicCache(maxAge, staleWhileRevalidate) {
  const value = `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`;
  return (req, res, next) => {
    res.set('Cache-Control', value);
    next();
  };
}
