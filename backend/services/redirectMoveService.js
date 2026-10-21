/**
 * Moving a page's redirects
 *
 * When a page changes address - a subject page or a blog post whose URL
 * handle was edited - redirects must follow it: nothing may redirect away
 * from the new address, rules that led to the old address now lead to the
 * new one (so there is never a chain of hops), and optionally the old
 * address itself redirects to the new one.
 */

import Redirect from '../models/Redirect.js';
import PageSeo from '../models/PageSeo.js';
import { SITE_URL } from './seoSchemaBuilders.js';

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** This site's host, with or without "www.", over http or https. */
const SITE_ORIGIN_PATTERN = `https?://(?:www\\.)?${escapeRegExp(new URL(SITE_URL).host.replace(/^www\./, ''))}`;

/**
 * Pattern matching any spelling of a redirect target that lands on a path on
 * this site: relative or absolute on this site's own host, with or without a
 * trailing slash, in any letter case, with an optional query or fragment
 * captured. A target on another site is never matched.
 *
 * @param {string} path
 * @returns {RegExp}
 */
export function targetPattern(path) {
  return new RegExp(`^(?:${SITE_ORIGIN_PATTERN})?${escapeRegExp(path)}/?([?#].*)?$`, 'i');
}

/**
 * Move redirects when a page changes address.
 *
 * - Nothing may redirect away from the new address any more: it is a live page.
 * - Redirects that ended at the old address now end at the new one, so there
 *   is never a chain of hops. A query or fragment on the old target is kept.
 * - Optionally, the old address itself redirects to the new one.
 *
 * @param {string} oldPath
 * @param {string} newPath
 * @param {{ createRedirect: boolean, adminId: * }} options
 * @returns {Promise<Object|null>} The redirect left at the old address, if any.
 */
export async function moveRedirects(oldPath, newPath, { createRedirect, adminId, note = 'Page URL changed' }) {
  await Redirect.deleteMany({ sourcePath: { $regex: `^${escapeRegExp(newPath)}/?$`, $options: 'i' } });

  const oldTarget = targetPattern(oldPath);
  const pointingAtOld = await Redirect.find({ targetUrl: { $regex: oldTarget } }).select('targetUrl').lean();
  if (pointingAtOld.length) {
    await Redirect.bulkWrite(
      pointingAtOld.map((record) => ({
        updateOne: {
          filter: { _id: record._id },
          update: { $set: { targetUrl: `${newPath}${record.targetUrl.match(oldTarget)?.[1] || ''}` } },
        },
      })),
    );
  }

  let redirect = null;
  if (createRedirect) {
    redirect = await Redirect.findOneAndUpdate(
      { sourcePath: oldPath },
      {
        $set: {
          targetUrl: newPath,
          statusCode: 301,
          matchType: 'exact',
          isActive: true,
          note,
        },
        $setOnInsert: { createdBy: adminId || null },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
    );
  }

  // A redirect from either address to itself would loop forever. Only the two
  // addresses this change touched are checked, never unrelated records.
  for (const path of [oldPath, newPath]) {
    const record = await Redirect.findOne({ sourcePath: path }).select('targetUrl').lean();
    if (record && targetPattern(path).test(record.targetUrl)) {
      await Redirect.deleteOne({ _id: record._id });
      if (redirect && String(redirect._id) === String(record._id)) redirect = null;
    }
  }
  return redirect;
}


/**
 * Move a page-level SEO override to the page's new address. A canonical that
 * named the old address is repointed; one aimed anywhere else is kept. When
 * the new address already has its own override, that one wins and the old one
 * is left for the admin to tidy up.
 *
 * @param {string} oldPath
 * @param {string} newPath
 */
export async function movePageSeo(oldPath, newPath) {
  const [oldSeo, newSeo] = await Promise.all([
    PageSeo.findOne({ path: oldPath }),
    PageSeo.exists({ path: newPath }),
  ]);
  if (!oldSeo || newSeo) return;
  oldSeo.path = newPath;
  if (oldSeo.canonicalUrl && targetPattern(oldPath).test(oldSeo.canonicalUrl)) {
    oldSeo.canonicalUrl = `${SITE_URL}${newPath}`;
  }
  await oldSeo.save();
}
