/**
 * Simple In-Memory Cache Utility
 * Basic caching for API responses
 * 
 * Features:
 * - In-memory storage only
 * - Cache invalidation on logout
 * - Simple key-value store
 */

// Cache storage
const cache = new Map();

/**
 * Get cached value by key
 * @param {string} key - Cache key
 * @returns {any|null} Cached value or null
 */
export const getCache = (key) => {
  return cache.get(key) || null;
};

/**
 * Set cached value
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 */
export const setCache = (key, value) => {
  cache.set(key, value);
};

/**
 * Remove cached value by key
 * @param {string} key - Cache key
 */
export const removeCache = (key) => {
  cache.delete(key);
};

/**
 * Clear all cache
 */
export const clearCache = () => {
  cache.clear();
};

/**
 * Generate cache key for tutor listing
 * @returns {string} Cache key
 */
export const getTutorListCacheKey = () => {
  return 'tutors:list';
};

/**
 * Generate cache key for tutor profile
 * @param {string} tutorId - Tutor ID
 * @returns {string} Cache key
 */
export const getTutorProfileCacheKey = (tutorId) => {
  return `tutors:profile:${tutorId}`;
};

/**
 * Generate cache key for tutor availability
 * @param {string} tutorId - Tutor ID
 * @returns {string} Cache key
 */
export const getTutorAvailabilityCacheKey = (tutorId) => {
  return `tutors:availability:${tutorId}`;
};

/**
 * Generate cache key for tutor slots
 * @param {string} tutorId - Tutor ID
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {string} Cache key
 */
export const getTutorSlotsCacheKey = (tutorId, startDate, endDate) => {
  return `tutors:slots:${tutorId}:${startDate}:${endDate}`;
};

/**
 * Initialize cache - listen for logout events to clear cache
 */
export const initCache = () => {
  // Clear cache on logout
  const handleLogout = () => {
    clearCache();
  };

  window.addEventListener('auth:logout', handleLogout);

  // Return cleanup function (though it's not critical for this simple cache)
  return () => {
    window.removeEventListener('auth:logout', handleLogout);
  };
};
