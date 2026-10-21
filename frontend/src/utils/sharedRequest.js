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
 * Run `load` once per key within the time window and share its result.
 *
 * @template T
 * @param {string} key - Identifies the request, including its parameters.
 * @param {() => Promise<T>} load - Makes the request.
 * @param {number} [ttlMs] - How long a successful answer is reused.
 * @returns {Promise<T>}
 */
export function sharedRequest(key, load, ttlMs = DEFAULT_TTL_MS) {
  const cached = entries.get(key);
  if (cached && Date.now() - cached.at < ttlMs) return cached.promise;

  const promise = load();
  entries.set(key, { at: Date.now(), promise });
  promise.catch(() => {
    if (entries.get(key)?.promise === promise) entries.delete(key);
  });
  return promise;
}
