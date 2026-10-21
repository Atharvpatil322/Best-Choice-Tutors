/**
 * SEO change notifications
 *
 * Called after any admin edit that changes what the public site publishes:
 * page metadata, structured data settings, redirects, blog posts, subject
 * pages. Clears the build caches and schedules a site rebuild, so the edit
 * reaches search engines without anyone remembering to redeploy.
 */

import { clearSeoBuildCache } from './seoBuildCache.js';
import { schedulePublish } from './sitePublishService.js';

/**
 * @param {string} reason - Short description, shown on the SEO dashboard.
 */
export function noteSeoChange(reason) {
  clearSeoBuildCache();
  schedulePublish(reason);
}
