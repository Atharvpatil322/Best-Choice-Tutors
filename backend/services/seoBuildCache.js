/**
 * Build answer cache
 *
 * The frontend build asks the API for every page's head within seconds, so
 * the page list and each head are reused briefly. Any edit that changes which
 * pages exist or what their heads say clears the cache (see noteSeoChange),
 * so a build started straight after sees the edit.
 */

const BUILD_CACHE_MS = 30 * 1000;

let pathList = { at: 0, value: null };
const heads = new Map();

const fresh = (entry) => entry && Date.now() - entry.at < BUILD_CACHE_MS;

/** The cached page list, if still fresh. */
export function getCachedPathList() {
  return fresh(pathList) ? pathList.value : null;
}

/** Remember the page list. */
export function setCachedPathList(value) {
  pathList = { at: Date.now(), value };
}

/** A cached head for a path, if still fresh. */
export function getCachedHead(path) {
  const entry = heads.get(path);
  return fresh(entry) ? entry.value : null;
}

/** Remember a head for a path. */
export function setCachedHead(path, value) {
  heads.set(path, { at: Date.now(), value });
}

/** Forget every cached answer. */
export function clearSeoBuildCache() {
  pathList = { at: 0, value: null };
  heads.clear();
}
