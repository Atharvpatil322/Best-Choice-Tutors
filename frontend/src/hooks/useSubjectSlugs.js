/**
 * Subject slugs
 *
 * Loads the current subject page slugs once per page load and lets
 * components re-render when they arrive, so every subject link follows an
 * admin's URL changes. The last answer is kept in localStorage, so a returning
 * visitor gets the right links on the first render.
 */

import { useSyncExternalStore } from 'react';
import {
  setSubjectSlugs,
  subscribeSubjectSlugs,
  getSubjectSlugsVersion,
  areSubjectSlugsLoaded,
} from '@/constants/subjects';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/+$/, '');
const STORAGE_KEY = 'bct:subject-slugs';

let loading = null;

/** Read the slugs saved by an earlier visit, if storage allows. */
function readStored() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
    return Array.isArray(stored) ? stored : null;
  } catch {
    return null;
  }
}

/**
 * Fetch the current slugs. Safe to call repeatedly: only the first call
 * makes a request. On failure the name-derived slugs stay in use.
 *
 * @returns {Promise<void>}
 */
export function loadSubjectSlugs() {
  if (loading) return loading;
  const stored = typeof window !== 'undefined' ? readStored() : null;
  // A saved answer may be out of date, so it is applied without marking the
  // registry settled: an unknown slug is not trusted until the fresh one
  // arrives.
  if (stored) setSubjectSlugs(stored, { settled: false });

  loading = fetch(`${API_BASE_URL}/public/subjects`)
    .then((response) => (response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`))))
    .then((data) => {
      const subjects = (data.subjects || []).map(({ name, slug }) => ({ name, slug }));
      setSubjectSlugs(subjects);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
      } catch {
        /* storage unavailable; the in-memory registry is enough */
      }
    })
    .catch(() => {
      // Keep what is in use and treat it as settled, so pages do not wait.
      setSubjectSlugs(stored || []);
    });
  return loading;
}

/**
 * Re-render when subject slugs change.
 *
 * @returns {{ ready: boolean }} ready - the API has answered (or failed), so a
 *   slug that matches no subject really is unknown.
 */
export function useSubjectSlugs() {
  useSyncExternalStore(subscribeSubjectSlugs, getSubjectSlugsVersion, getSubjectSlugsVersion);
  return { ready: areSubjectSlugsLoaded() };
}
