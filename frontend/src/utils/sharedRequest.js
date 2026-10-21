/**
 * Shared public requests
 *
 * Several components on one page ask for the same public data - the homepage
 * FAQ section and the footer both want the FAQs, for example. Requests made
 * through here share one network call and reuse the answer briefly, instead
 * of each component fetching its own copy. A failed request is not kept, so
 * the next caller tries again.
 */

const DEFAULT_TTL_MS = 60 * 1000;
const entries = new Map();
/**
 * Key prefixes an admin changed in this tab. The API lets browsers keep these
 * lists for a few minutes, so requests for them skip the browser's copy from
 * then on - otherwise the admin would keep seeing the list from before the edit.
 */
const changedPrefixes = new Set();

/**
 * Run `load` once per key within the time window and share its result.
 *
 * @template T
 * @param {string} key - Identifies the request, including its parameters.
 * @param {(options: { fresh: boolean }) => Promise<T>} load - Makes the
 *   request. When `fresh` is true it should bypass the browser's HTTP cache
 *   (fetch's `cache: "no-cache"`), because the data changed in this tab.
 * @param {number} [ttlMs] - How long a successful answer is reused.
 * @returns {Promise<T>}
 */
export function sharedRequest(key, load, ttlMs = DEFAULT_TTL_MS) {
  const cached = entries.get(key);
  if (cached && Date.now() - cached.at < ttlMs) return cached.promise;

  const fresh = [...changedPrefixes].some((prefix) => key.startsWith(prefix));
  const promise = load({ fresh });
  entries.set(key, { at: Date.now(), promise });
  promise.catch(() => {
    if (entries.get(key)?.promise === promise) entries.delete(key);
  });
  return promise;
}

/**
 * Drop shared answers whose key starts with `prefix`, so the next caller
 * fetches fresh data - used after an admin changes the list in this tab.
 *
 * @param {string} prefix
 */
export function forgetShared(prefix) {
  for (const key of entries.keys()) {
    if (key.startsWith(prefix)) entries.delete(key);
  }
}

/**
 * Run an admin change, then drop the shared answers it makes stale. They are
 * dropped whether or not the request succeeded, since a failed response can
 * still follow a change the server applied.
 *
 * @template T
 * @param {string} prefix - Key prefix of the affected shared requests.
 * @param {() => Promise<T>} change - Makes the admin request.
 * @returns {Promise<T>}
 */
export async function changeShared(prefix, change) {
  try {
    return await change();
  } finally {
    changedPrefixes.add(prefix);
    forgetShared(prefix);
  }
}

/** HTTP cache mode for a shared request's fetch. */
export const cacheMode = (fresh) => (fresh ? "no-cache" : "default");
