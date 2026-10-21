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
/**
 * Waits before retrying a build whose deploy hook call failed. After the last
 * one the edits stay unpublished until the admin publishes or edits again, so
 * a broken hook is not called forever.
 */
const RETRY_DELAYS_MS = [5 * 60 * 1000, 15 * 60 * 1000, 60 * 60 * 1000];

let pendingTimer = null;
let pendingAt = null;
let pendingReasons = new Set();
let inFlight = null;
let retriesUsed = 0;

/** Whether a deploy hook is configured. */
export function isPublishConfigured() {
  return Boolean(process.env.RENDER_DEPLOY_HOOK_URL);
}

/**
 * Record the outcome of a publish attempt on the settings document.
 *
 * @param {Object} result
 */
async function recordPublish(fields) {
  try {
    // timestamps off: recording a publish is not an SEO edit, and must not
    // make the settings look changed since the last publish.
    await SeoSetting.updateOne(
      { singleton: 'global' },
      { $set: fields },
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
export function publishNow(reason) {
  // A second request while one is running (a double click, or the timer
  // firing during a manual publish) shares the first instead of starting a
  // second deploy.
  if (inFlight) return inFlight;
  inFlight = runPublish(reason).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function runPublish(reason) {
  if (pendingTimer) {
    clearTimeout(pendingTimer);
    pendingTimer = null;
    pendingAt = null;
  }
  const reasons = [...pendingReasons, reason].filter(Boolean);
  pendingReasons = new Set();
  // Stamped before the call: an edit made while the hook is being called may
  // not be in this build, so it must count as unpublished.
  const requestedAt = new Date();

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
    // Only the error's type: a malformed hook URL puts the URL - which holds
    // a secret key - into the message.
    result = { ok: false, message: `The deploy hook could not be reached (${err.name}).` };
  } finally {
    clearTimeout(timer);
  }

  const attempt = {
    'publish.lastAttemptAt': requestedAt,
    'publish.ok': result.ok,
    'publish.message': result.message,
    'publish.reason': [...new Set(reasons)].join(', ').slice(0, 500),
  };
  // Only a build that actually started moves the "published up to" point and
  // clears the waiting flag; after a failure the edits still count as
  // unpublished.
  await recordPublish(result.ok ? { ...attempt, 'publish.requestedAt': requestedAt } : attempt);
  if (result.ok) {
    retriesUsed = 0;
  } else if (!pendingTimer && retriesUsed < RETRY_DELAYS_MS.length) {
    // Nothing newer has armed a build, so retry this one after a pause.
    for (const item of reasons) pendingReasons.add(item);
    pendingReasons.add('retry after a failed build');
    armTimer(RETRY_DELAYS_MS[retriesUsed]);
    retriesUsed += 1;
  }
  if (result.ok && !pendingTimer) {
    // Cleared only if nothing newer is waiting: an edit saved while the hook
    // was being called arms a new build, and its marker must survive.
    await SeoSetting.updateOne(
      { singleton: 'global', 'publish.pendingSince': { $lte: requestedAt } },
      { $set: { 'publish.pendingSince': null } },
      { timestamps: false },
    ).catch((err) => console.error('Clearing pending publish failed:', err?.message));
  }
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
  // A new edit starts a fresh cycle, with its own retries if the hook fails.
  retriesUsed = 0;
  armTimer();
  // Remembered in the database too, so a restart within the quiet period
  // (every deploy restarts the API) does not lose the build.
  SeoSetting.updateOne(
    { singleton: 'global', 'publish.pendingSince': null },
    { $set: { 'publish.pendingSince': new Date() } },
    { timestamps: false },
  ).catch((err) => console.error('Recording pending publish failed:', err?.message));
}

function armTimer(delayMs = AUTO_PUBLISH_DELAY_MS) {
  if (pendingTimer) clearTimeout(pendingTimer);
  pendingAt = new Date(Date.now() + delayMs);
  pendingTimer = setTimeout(() => {
    pendingTimer = null;
    pendingAt = null;
    publishNow('').catch((err) => console.error('Automatic site publish failed:', err?.message));
  }, delayMs);
  // Never keep the process alive just to publish.
  pendingTimer.unref?.();
}

/**
 * At start-up, re-arm a build that was waiting when the API last stopped.
 *
 * The retry count is not kept across restarts, on purpose: changing the API's
 * environment (fixing a broken deploy hook URL, say) restarts it, and that is
 * exactly when unpublished edits should be tried again. A restart costs at
 * most one extra hook call.
 */
export async function resumePendingPublish() {
  if (!isPublishConfigured()) return;
  try {
    const settings = await SeoSetting.findOne({ singleton: 'global' }).select('publish').lean();
    if (settings?.publish?.pendingSince) {
      pendingReasons.add('edits made before a restart');
      armTimer();
    }
  } catch (err) {
    console.error('Resuming pending publish failed:', err?.message);
  }
}

/** Whether an automatic build (or a retry) is scheduled. */
export function isPublishPending() {
  return Boolean(pendingTimer);
}

/** When the scheduled build will run, or null when none is scheduled. */
export function nextPublishAt() {
  return pendingAt;
}
