/**
 * Site publishing
 *
 * The public site is a static build, so SEO edits made in the admin panel -
 * titles, structured data, redirects, new blog posts, subject URLs - reach
 * search engines only when the frontend is rebuilt. This triggers that
 * rebuild through a Render deploy hook.
 *
 * RENDER_DEPLOY_HOOK_URL is the static site's deploy hook (Render dashboard >
 * the frontend service > Settings > Deploy Hook). It contains a secret key,
 * so it lives only in the API's environment. Without it nothing is triggered
 * and changes go live with the next normal deploy.
 *
 * Edits trigger a build automatically after a short quiet period, so a burst
 * of edits produces one build. The admin can also publish at once.
 */

import SeoSetting from '../models/SeoSetting.js';

/** Quiet period after the last edit before an automatic build starts. */
const AUTO_PUBLISH_DELAY_MS = 2 * 60 * 1000;
const HOOK_TIMEOUT_MS = 15 * 1000;

let pendingTimer = null;
let pendingReasons = new Set();

/** Whether a deploy hook is configured. */
export function isPublishConfigured() {
  return Boolean(process.env.RENDER_DEPLOY_HOOK_URL);
}

/**
 * Record the outcome of a publish attempt on the settings document.
 *
 * @param {Object} result
 */
async function recordPublish(result) {
  try {
    // timestamps off: recording a publish is not an SEO edit, and must not
    // make the settings look changed since the last publish.
    await SeoSetting.updateOne(
      { singleton: 'global' },
      { $set: { publish: result } },
      { upsert: true, setDefaultsOnInsert: true, timestamps: false },
    );
  } catch (err) {
    console.error('Recording site publish failed:', err?.message);
  }
}

/**
 * Call the deploy hook now.
 *
 * @param {string} reason - What prompted the build, shown on the dashboard.
 * @returns {Promise<{ ok: boolean, configured: boolean, message: string }>}
 */
export async function publishNow(reason) {
  if (pendingTimer) {
    clearTimeout(pendingTimer);
    pendingTimer = null;
  }
  const reasons = [...pendingReasons, reason].filter(Boolean);
  pendingReasons = new Set();

  if (!isPublishConfigured()) {
    return {
      ok: false,
      configured: false,
      message: 'No deploy hook is configured, so changes go live with the next normal deploy.',
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HOOK_TIMEOUT_MS);
  let result;
  try {
    const response = await fetch(process.env.RENDER_DEPLOY_HOOK_URL, {
      method: 'POST',
      signal: controller.signal,
    });
    result = response.ok
      ? { ok: true, message: 'Site build started. Changes are live in a few minutes.' }
      : { ok: false, message: `The deploy hook answered HTTP ${response.status}.` };
  } catch (err) {
    result = { ok: false, message: `The deploy hook could not be reached (${err.message}).` };
  } finally {
    clearTimeout(timer);
  }

  await recordPublish({
    requestedAt: new Date(),
    ok: result.ok,
    message: result.message,
    reason: [...new Set(reasons)].join(', ').slice(0, 500),
  });
  return { ...result, configured: true };
}

/**
 * Schedule a build after the quiet period. Further edits within the period
 * restart it, so a burst of edits produces a single build. Does nothing when
 * no deploy hook is configured.
 *
 * @param {string} reason
 */
export function schedulePublish(reason) {
  if (!isPublishConfigured()) return;
  if (reason) pendingReasons.add(reason);
  if (pendingTimer) clearTimeout(pendingTimer);
  pendingTimer = setTimeout(() => {
    pendingTimer = null;
    publishNow('').catch((err) => console.error('Automatic site publish failed:', err?.message));
  }, AUTO_PUBLISH_DELAY_MS);
  // Never keep the process alive just to publish.
  pendingTimer.unref?.();
}

/** Whether an automatic build is waiting for the quiet period to end. */
export function isPublishPending() {
  return Boolean(pendingTimer);
}
