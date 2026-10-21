/**
 * Admin SEO Tools Controller
 *
 * Backs the tabbed SEO section of the admin panel: site-wide settings, URL
 * redirects, the 404 log, and programmatic landing pages.
 *
 * Page-level meta (title, description, canonical) is handled separately by
 * adminSeoController.js and is unchanged.
 */

import SeoSetting from '../models/SeoSetting.js';
import Redirect from '../models/Redirect.js';
import NotFoundLog from '../models/NotFoundLog.js';
import PseoTemplate from '../models/PseoTemplate.js';
import PseoPage from '../models/PseoPage.js';
import AdminAuditLog from '../models/AdminAuditLog.js';
import { generatePagesForTemplate, buildPagesForTemplate } from '../services/pseoService.js';
import { getSeoSettings } from '../services/seoContentService.js';
import { buildSeoHead } from '../services/seoHtmlService.js';
import { missingOrganizationFields } from '../services/seoSchemaBuilders.js';
import { SITE_URL } from '../services/seoSchemaBuilders.js';
import { noteSeoChange } from '../services/seoChangeService.js';
import { publishNow, isPublishConfigured, isPublishPending } from '../services/sitePublishService.js';
import { collectBuildPaths } from './publicSeoController.js';
import PageSeo from '../models/PageSeo.js';
import Blog from '../models/Blog.js';
import Subject from '../models/Subject.js';

/**
 * Reject the request unless the caller is an administrator.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {boolean} True when the caller may proceed.
 */
function requireAdmin(req, res) {
  if (req.user?.role !== 'Admin') {
    res.status(403).json({ message: 'Access denied: Admin role required' });
    return false;
  }
  return true;
}

/**
 * Append an audit entry, never failing the request if logging errors.
 *
 * @param {import('express').Request} req
 * @param {string} action
 * @param {string} entityType
 * @param {import('mongoose').Types.ObjectId} entityId
 * @param {Object} [metadata]
 */
async function audit(req, action, entityType, entityId, metadata = {}) {
  try {
    await AdminAuditLog.create({
      adminId: req.user._id,
      action,
      entityType,
      entityId,
      metadata,
    });
  } catch (err) {
    console.error('SEO audit log failed:', err?.message);
  }
}

/**
 * Normalise a user-entered path to a leading slash with no trailing slash.
 *
 * @param {string} value
 * @returns {string}
 */
function normalisePath(value) {
  let path = String(value ?? '').trim();
  if (!path) return '';
  if (!path.startsWith('/') && !/^https?:\/\//i.test(path)) path = `/${path}`;
  if (path.length > 1 && !/^https?:\/\//i.test(path)) path = path.replace(/\/+$/, '');
  return path;
}

/* -------------------------------------------------------------- organization */

const ORGANIZATION_TYPES = ['EducationalOrganization', 'Organization', 'OnlineBusiness', 'LocalBusiness'];
const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const ORGANIZATION_TEXT_FIELDS = [
  'name', 'legalName', 'alternateName', 'slogan', 'description', 'email', 'telephone',
  'priceRange', 'companyNumber', 'vatID', 'taxID', 'websiteName', 'websiteAlternateName',
];
const ORGANIZATION_URL_FIELDS = ['url', 'logo', 'image'];

/** Raised for input an admin can correct; answered with 400 and the message. */
class SettingsValidationError extends Error {}

/**
 * Trimmed string. Length limits are enforced by the model, so an oversized
 * paste is rejected with its message rather than silently cut short.
 *
 * @param {unknown} value
 * @returns {string}
 */
function cleanText(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') throw new SettingsValidationError('Expected text, got a list or object');
  return String(value).trim();
}

/** Most entries any one list may hold, and the longest each entry may be. */
const MAX_LIST_ITEMS = 50;
const MAX_LIST_ITEM_LENGTH = 300;

/**
 * A list of trimmed, non-empty strings from an array or a newline-separated
 * string.
 *
 * @param {unknown} value
 * @returns {string[]}
 */
function cleanList(value) {
  const list = (Array.isArray(value) ? value : cleanText(value).split('\n')).map(cleanText).filter(Boolean);
  if (list.length > MAX_LIST_ITEMS) throw new SettingsValidationError(`A list can hold at most ${MAX_LIST_ITEMS} entries`);
  if (list.some((item) => item.length > MAX_LIST_ITEM_LENGTH)) {
    throw new SettingsValidationError(`List entries cannot exceed ${MAX_LIST_ITEM_LENGTH} characters`);
  }
  return list;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Accept an absolute http(s) URL or a site-relative path; blank stays blank.
 * "//host/path" is refused: it is a link to another site, not a path.
 *
 * @param {string} label - Field name for the error message.
 * @param {unknown} value
 * @returns {string}
 */
function cleanUrl(label, value) {
  const url = cleanText(value);
  if (!url) return '';
  if (/^https?:\/\/[^\s]+$/i.test(url) || /^\/(?!\/)[^\s]*$/.test(url)) return url;
  throw new SettingsValidationError(`${label} must be a full https:// address or a path starting with /`);
}

/**
 * Validate and normalise the organization block of a settings update. Only
 * fields present in the input are returned, so a partial update leaves the
 * rest untouched.
 *
 * @param {Object} input
 * @returns {Object} Fields to assign onto settings.organization.
 */
function cleanOrganization(input) {
  const out = {};

  if (input.type !== undefined) {
    if (!ORGANIZATION_TYPES.includes(input.type)) throw new SettingsValidationError('Unknown organization type');
    out.type = input.type;
  }
  for (const field of ORGANIZATION_TEXT_FIELDS) {
    if (input[field] !== undefined) out[field] = cleanText(input[field]);
  }
  for (const field of ORGANIZATION_URL_FIELDS) {
    if (input[field] !== undefined) out[field] = cleanUrl(field, input[field]);
  }
  if (out.email && !EMAIL_PATTERN.test(out.email)) {
    throw new SettingsValidationError('Email address is not valid');
  }
  if (input.onlineOnly !== undefined) out.onlineOnly = Boolean(input.onlineOnly);

  if (input.address !== undefined) {
    const address = input.address || {};
    const country = cleanText(address.addressCountry).toUpperCase();
    if (country && !/^[A-Z]{2}$/.test(country)) {
      throw new SettingsValidationError('Country must be a two-letter code, for example GB');
    }
    out.address = {
      streetAddress: cleanText(address.streetAddress),
      addressLocality: cleanText(address.addressLocality),
      addressRegion: cleanText(address.addressRegion),
      postalCode: cleanText(address.postalCode),
      addressCountry: country,
    };
  }

  if (input.geo !== undefined) {
    const latitude = cleanText(input.geo?.latitude);
    const longitude = cleanText(input.geo?.longitude);
    const inRange = (value, limit) => value === '' || (Number.isFinite(Number(value)) && Math.abs(Number(value)) <= limit);
    if (!inRange(latitude, 90) || !inRange(longitude, 180)) {
      throw new SettingsValidationError('Latitude must be between -90 and 90, longitude between -180 and 180');
    }
    if (Boolean(latitude) !== Boolean(longitude)) {
      throw new SettingsValidationError('Enter both latitude and longitude, or neither');
    }
    out.geo = { latitude, longitude };
  }

  if (input.foundingDate !== undefined) {
    const date = cleanText(input.foundingDate);
    if (date && !/^\d{4}(-\d{2}(-\d{2})?)?$/.test(date)) {
      throw new SettingsValidationError('Founding date must be a year (2024) or a date (2024-01-31)');
    }
    out.foundingDate = date;
  }

  for (const field of ['founders', 'areaServed', 'knowsAbout']) {
    if (input[field] !== undefined) out[field] = cleanList(input[field]);
  }
  if (input.sameAs !== undefined) {
    out.sameAs = cleanList(input.sameAs).map((url) => {
      if (!/^https?:\/\/[^\s]+$/i.test(url)) {
        throw new SettingsValidationError(`Social profile "${url}" must be a full https:// address`);
      }
      return url;
    });
  }

  if (input.contactPoints !== undefined) {
    if (!Array.isArray(input.contactPoints)) throw new SettingsValidationError('Contact points must be a list');
    out.contactPoints = input.contactPoints.slice(0, 10).map((point) => {
      const cleaned = {
        contactType: cleanText(point?.contactType),
        telephone: cleanText(point?.telephone),
        email: cleanText(point?.email),
        areaServed: cleanText(point?.areaServed),
        availableLanguage: cleanList(point?.availableLanguage),
      };
      if (cleaned.email && !EMAIL_PATTERN.test(cleaned.email)) {
        throw new SettingsValidationError(`Contact point email "${cleaned.email}" is not valid`);
      }
      return cleaned;
    });
  }

  if (input.openingHours !== undefined) {
    if (!Array.isArray(input.openingHours)) throw new SettingsValidationError('Opening hours must be a list');
    out.openingHours = input.openingHours.slice(0, 14).map((slot) => {
      const days = cleanList(slot?.days).filter((day) => WEEK_DAYS.includes(day));
      const opens = cleanText(slot?.opens);
      const closes = cleanText(slot?.closes);
      const time = /^([01]\d|2[0-3]):[0-5]\d$/;
      if (!time.test(opens) || !time.test(closes)) {
        throw new SettingsValidationError('Opening and closing times must be HH:MM, for example 09:00');
      }
      if (!days.length) throw new SettingsValidationError('Pick at least one day for each set of opening hours');
      return { days, opens, closes };
    });
  }

  return out;
}

/* ------------------------------------------------------------------ settings */

/**
 * GET /api/admin/seo-tools/settings
 * Return site-wide SEO settings, creating defaults on first access.
 */
export async function getSettings(req, res, next) {
  if (!requireAdmin(req, res)) return;
  try {
    const settings = await getSeoSettings();
    return res.status(200).json({ settings });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/seo-tools/settings
 * Update site-wide SEO settings. Only recognised fields are applied.
 */
export async function updateSettings(req, res, next) {
  if (!requireAdmin(req, res)) return;
  try {
    const settings = await getSeoSettings();
    const {
      robotsMode,
      robotsOverride,
      sitemapExcludePaths,
      sitemapIncludeBlogs,
      sitemapIncludePseo,
      llmsIntro,
      verification,
      schemaToggles,
      organization,
    } = req.body ?? {};

    if (robotsMode !== undefined) settings.robotsMode = robotsMode;
    if (robotsOverride !== undefined) settings.robotsOverride = String(robotsOverride);
    if (Array.isArray(sitemapExcludePaths)) {
      settings.sitemapExcludePaths = sitemapExcludePaths.map(normalisePath).filter(Boolean);
    }
    if (sitemapIncludeBlogs !== undefined) settings.sitemapIncludeBlogs = !!sitemapIncludeBlogs;
    if (sitemapIncludePseo !== undefined) settings.sitemapIncludePseo = !!sitemapIncludePseo;
    if (llmsIntro !== undefined) settings.llmsIntro = String(llmsIntro);

    if (verification && typeof verification === 'object') {
      for (const key of ['google', 'bing', 'pinterest', 'yandex']) {
        if (verification[key] !== undefined) {
          settings.verification[key] = String(verification[key]).trim();
        }
      }
    }
    if (schemaToggles && typeof schemaToggles === 'object') {
      for (const key of ['faq', 'breadcrumb', 'service', 'article', 'organization']) {
        if (schemaToggles[key] !== undefined) {
          settings.schemaToggles[key] = !!schemaToggles[key];
        }
      }
    }

    if (organization && typeof organization === 'object') {
      const cleaned = cleanOrganization(organization);
      for (const [key, value] of Object.entries(cleaned)) {
        settings.set(`organization.${key}`, value);
      }
    }

    settings.updatedBy = req.user._id;
    await settings.save();
    await audit(req, 'SEO_SETTINGS_UPDATED', 'SeoSetting', settings._id);
    noteSeoChange('SEO settings');

    return res.status(200).json({ message: 'SEO settings updated', settings });
  } catch (err) {
    if (err instanceof SettingsValidationError) {
      return res.status(400).json({ message: err.message });
    }
    if (err?.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(err.errors)[0]?.message || 'Invalid settings' });
    }
    next(err);
  }
}

/**
 * GET /api/admin/seo-tools/schema-preview
 * The homepage structured data exactly as the next build will publish it,
 * plus the recommended Organization fields still missing.
 */
export async function getSchemaPreview(req, res, next) {
  if (!requireAdmin(req, res)) return;
  try {
    const head = await buildSeoHead('/');
    const jsonLdEntry = head.entries.find((entry) => entry.key === 'jsonld');
    const schemas = [...(jsonLdEntry?.html || '').matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(
      (match) => JSON.parse(match[1]),
    );
    const settings = await getSeoSettings();
    return res.status(200).json({
      schemas,
      missing: missingOrganizationFields(settings.toObject().organization || {}),
    });
  } catch (err) {
    next(err);
  }
}

/* ----------------------------------------------------------------- redirects */

const REDIRECT_STATUSES = [301, 302, 307, 308];
const REDIRECT_MATCH_TYPES = ['exact', 'prefix', 'regex'];
const SITE_HOST = new URL(SITE_URL).host.replace(/^www\./, '');

/** Raised for a redirect that cannot be saved as entered. */
class RedirectRuleError extends Error {}

/**
 * The site path a redirect target lands on, or null for another site.
 * Query, fragment and trailing slash are dropped, so "/a/?x=1" is "/a".
 *
 * @param {string} target
 * @returns {string|null}
 */
function sitePathOf(target) {
  let path = String(target || '');
  if (/^https?:\/\//i.test(path)) {
    let url;
    try {
      url = new URL(path);
    } catch {
      return null;
    }
    if (url.host.replace(/^www\./, '') !== SITE_HOST) return null;
    path = url.pathname;
  }
  if (!path.startsWith('/')) return null;
  path = path.split(/[?#]/)[0];
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

/**
 * Follow a target through existing exact redirects to the page it finally
 * reaches, so a new rule never adds a hop to a chain, and refuse a rule whose
 * chain would lead back to its own source.
 *
 * @param {string} source
 * @param {string} target
 * @param {*} [excludeId] - The rule being edited, ignored while following.
 * @returns {Promise<string>} The final target.
 */
async function finalTarget(source, target, excludeId) {
  const seen = new Set([sitePathOf(source)]);
  let current = target;
  for (let hop = 0; hop < 10; hop += 1) {
    const path = sitePathOf(current);
    if (!path) return current;
    if (seen.has(path)) {
      throw new RedirectRuleError('This redirect would create a loop back to its own source.');
    }
    seen.add(path);
    const next = await Redirect.findOne({
      sourcePath: path,
      matchType: 'exact',
      isActive: true,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
      .select('targetUrl')
      .lean();
    if (!next) return current;
    // Keep the query and fragment the admin entered (a campaign tag, an
    // anchor) when skipping past the intermediate address.
    current = withQueryOf(current, next.targetUrl);
  }
  throw new RedirectRuleError('The target already passes through too many redirects.');
}

/**
 * Point rules that led to `source` straight at its final target, so adding
 * this rule never leaves visitors on a two-step chain.
 *
 * @param {string} source
 * @param {string} target
 * @param {*} ruleId
 */
async function flattenIncoming(source, target, ruleId) {
  // Exact rules only: a prefix rule ending at `source` also carries the rest
  // of the path along (/old/article -> /section/article), which an exact rule
  // on `source` would never match, so rewriting it would change where those
  // deeper addresses go.
  const incoming = await Redirect.find({ _id: { $ne: ruleId }, isActive: true, matchType: 'exact' })
    .select('sourcePath targetUrl')
    .lean();
  const updates = incoming
    .filter((rule) => sitePathOf(rule.targetUrl) === sitePathOf(source) && rule.sourcePath !== sitePathOf(target))
    .map((rule) => ({
      updateOne: { filter: { _id: rule._id }, update: { $set: { targetUrl: withQueryOf(rule.targetUrl, target) } } },
    }));
  if (updates.length) await Redirect.bulkWrite(updates);
}

/**
 * The flattened destination for a rule that pointed at an address now
 * redirecting on: the new target, keeping the query string and fragment the
 * rule's own target carried (a campaign tag, say). Where both set the same
 * parameter, the rule's own value wins, as it did over two hops.
 *
 * @param {string} previousTarget - The incoming rule's old target.
 * @param {string} nextTarget - Where that address now leads.
 * @returns {string}
 */
function withQueryOf(previousTarget, nextTarget) {
  const base = 'http://placeholder.invalid';
  let previous;
  let next;
  try {
    previous = new URL(previousTarget, base);
    next = new URL(nextTarget, base);
  } catch {
    return nextTarget;
  }
  if (!previous.search && !previous.hash) return nextTarget;
  previous.searchParams.forEach((value, key) => next.searchParams.set(key, value));
  if (previous.hash) next.hash = previous.hash;
  const absolute = /^https?:\/\//i.test(nextTarget);
  return absolute ? next.toString() : `${next.pathname}${next.search}${next.hash}`;
}

/**
 * Validate the status and match type of a redirect.
 *
 * @param {{ statusCode?: *, matchType?: * }} input
 */
/**
 * Refuse "//host/path" and "/\host/path": browsers treat both as another
 * site, though they look like paths on this one.
 *
 * @param {string} value
 */
function checkNotProtocolRelative(value) {
  if (/^\/[\/\\]/.test(String(value || ''))) {
    throw new RedirectRuleError('Use a path on this site (starting with a single /) or a full https:// address');
  }
}

function checkRedirectOptions({ statusCode, matchType }) {
  if (statusCode !== undefined && !REDIRECT_STATUSES.includes(Number(statusCode))) {
    throw new RedirectRuleError('Status must be 301, 302, 307 or 308');
  }
  if (matchType !== undefined && !REDIRECT_MATCH_TYPES.includes(matchType)) {
    throw new RedirectRuleError('Match must be exact, prefix or regex');
  }
}

/** GET /api/admin/seo-tools/redirects — list redirects, newest first. */
export async function listRedirects(req, res, next) {
  if (!requireAdmin(req, res)) return;
  try {
    const redirects = await Redirect.find().sort({ createdAt: -1 }).lean();
    return res.status(200).json({ count: redirects.length, redirects });
  } catch (err) {
    next(err);
  }
}

/** POST /api/admin/seo-tools/redirects — create a redirect rule. */
export async function createRedirect(req, res, next) {
  if (!requireAdmin(req, res)) return;
  try {
    const { sourcePath, targetUrl, statusCode, matchType, note, isActive } = req.body ?? {};
    checkRedirectOptions({ statusCode, matchType });
    const source = matchType === 'regex' ? String(sourcePath ?? '').trim() : normalisePath(sourcePath);
    let target = normalisePath(targetUrl);

    if (!source || !target) {
      return res.status(400).json({ message: 'Source path and target URL are required' });
    }
    if (source === target) {
      return res.status(400).json({ message: 'Source and target cannot be the same — this would loop' });
    }
    checkNotProtocolRelative(source);
    checkNotProtocolRelative(target);
    if ((matchType ?? 'exact') === 'exact') target = await finalTarget(source, target);
    if (matchType === 'regex') {
      try {
        new RegExp(source);
      } catch {
        return res.status(400).json({ message: 'Source is not a valid regular expression' });
      }
    }

    const existing = await Redirect.findOne({ sourcePath: source });
    if (existing) {
      return res.status(409).json({ message: 'A redirect already exists for that source path' });
    }

    const redirect = await Redirect.create({
      sourcePath: source,
      targetUrl: target,
      statusCode: Number(statusCode ?? 301),
      matchType: matchType ?? 'exact',
      note: note ?? '',
      isActive: isActive === undefined ? true : !!isActive,
      createdBy: req.user._id,
    });

    // A redirect now exists for this path, so it is no longer an unresolved miss.
    await NotFoundLog.updateOne({ path: source }, { $set: { isResolved: true } });
    if (redirect.matchType === 'exact' && redirect.isActive) await flattenIncoming(source, target, redirect._id);
    await audit(req, 'SEO_REDIRECT_CREATED', 'Redirect', redirect._id, { sourcePath: source });
    noteSeoChange('redirects');

    return res.status(201).json({ message: 'Redirect created successfully', redirect });
  } catch (err) {
    if (err instanceof RedirectRuleError) return res.status(400).json({ message: err.message });
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A redirect already exists for that source path' });
    }
    next(err);
  }
}

/** PUT /api/admin/seo-tools/redirects/:id — update a redirect rule. */
export async function updateRedirect(req, res, next) {
  if (!requireAdmin(req, res)) return;
  try {
    const redirect = await Redirect.findById(req.params.id);
    if (!redirect) return res.status(404).json({ message: 'Redirect not found' });

    const { sourcePath, targetUrl, statusCode, matchType, note, isActive } = req.body ?? {};
    checkRedirectOptions({ statusCode, matchType });
    if (matchType !== undefined) redirect.matchType = matchType;
    if (sourcePath !== undefined) {
      redirect.sourcePath =
        redirect.matchType === 'regex' ? String(sourcePath).trim() : normalisePath(sourcePath);
    }
    if (targetUrl !== undefined) redirect.targetUrl = normalisePath(targetUrl);
    if (statusCode !== undefined) redirect.statusCode = Number(statusCode);
    if (note !== undefined) redirect.note = note;
    if (isActive !== undefined) redirect.isActive = !!isActive;

    if (redirect.sourcePath === redirect.targetUrl) {
      return res.status(400).json({ message: 'Source and target cannot be the same — this would loop' });
    }
    checkNotProtocolRelative(redirect.sourcePath);
    checkNotProtocolRelative(redirect.targetUrl);
    if (redirect.matchType === 'regex') {
      try {
        new RegExp(redirect.sourcePath);
      } catch {
        return res.status(400).json({ message: 'Source is not a valid regular expression' });
      }
    }
    if (redirect.matchType === 'exact' && redirect.isActive) {
      redirect.targetUrl = await finalTarget(redirect.sourcePath, redirect.targetUrl, redirect._id);
    }

    await redirect.save();
    if (redirect.matchType === 'exact' && redirect.isActive) {
      await flattenIncoming(redirect.sourcePath, redirect.targetUrl, redirect._id);
    }
    await audit(req, 'SEO_REDIRECT_UPDATED', 'Redirect', redirect._id);
    noteSeoChange('redirects');
    return res.status(200).json({ message: 'Redirect updated successfully', redirect });
  } catch (err) {
    if (err instanceof RedirectRuleError) return res.status(400).json({ message: err.message });
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A redirect already exists for that source path' });
    }
    next(err);
  }
}

/** DELETE /api/admin/seo-tools/redirects/:id — remove a redirect rule. */
export async function deleteRedirect(req, res, next) {
  if (!requireAdmin(req, res)) return;
  try {
    const redirect = await Redirect.findByIdAndDelete(req.params.id);
    if (!redirect) return res.status(404).json({ message: 'Redirect not found' });
    await audit(req, 'SEO_REDIRECT_DELETED', 'Redirect', redirect._id, {
      sourcePath: redirect.sourcePath,
    });
    noteSeoChange('redirects');
    return res.status(200).json({ message: 'Redirect deleted successfully' });
  } catch (err) {
    next(err);
  }
}

/* ------------------------------------------------------------------ 404 log */

/**
 * GET /api/admin/seo-tools/not-found
 * List logged misses, busiest first. Pass ?unresolvedOnly=true to hide paths
 * that already have a redirect.
 */
export async function listNotFound(req, res, next) {
  if (!requireAdmin(req, res)) return;
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const filter = req.query.unresolvedOnly === 'true' ? { isResolved: false } : {};
    const entries = await NotFoundLog.find(filter)
      .sort({ hits: -1, lastSeenAt: -1 })
      .limit(limit)
      .lean();
    return res.status(200).json({ count: entries.length, entries });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/admin/seo-tools/not-found/:id — remove one logged miss. */
export async function deleteNotFound(req, res, next) {
  if (!requireAdmin(req, res)) return;
  try {
    const entry = await NotFoundLog.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    return res.status(200).json({ message: 'Entry deleted successfully' });
  } catch (err) {
    next(err);
  }
}

/** POST /api/admin/seo-tools/not-found/clear — empty the log. */
export async function clearNotFound(req, res, next) {
  if (!requireAdmin(req, res)) return;
  try {
    const result = await NotFoundLog.deleteMany({});
    return res.status(200).json({ message: `Cleared ${result.deletedCount} entries` });
  } catch (err) {
    next(err);
  }
}

/* --------------------------------------------------------------------- PSEO */

/** Template fields an admin may set; anything else in a request is ignored. */
const TEMPLATE_FIELDS = [
  'name', 'pathPattern', 'titlePattern', 'descriptionPattern', 'headingPattern',
  'introPattern', 'subjects', 'locations', 'isActive',
];

/**
 * The template fields present in a request body.
 *
 * @param {Object} body
 * @returns {Object}
 */
function pickTemplateFields(body = {}) {
  return Object.fromEntries(TEMPLATE_FIELDS.filter((field) => body[field] !== undefined).map((field) => [field, body[field]]));
}

/** GET /api/admin/seo-tools/pseo/templates — list templates. */
export async function listPseoTemplates(req, res, next) {
  if (!requireAdmin(req, res)) return;
  try {
    const templates = await PseoTemplate.find().sort({ createdAt: -1 }).lean();
    const withCounts = await Promise.all(
      templates.map(async (template) => ({
        ...template,
        pageCount: await PseoPage.countDocuments({ templateId: template._id }),
      })),
    );
    return res.status(200).json({ count: withCounts.length, templates: withCounts });
  } catch (err) {
    next(err);
  }
}

/** POST /api/admin/seo-tools/pseo/templates — create a template. */
export async function createPseoTemplate(req, res, next) {
  if (!requireAdmin(req, res)) return;
  try {
    const { name, pathPattern, titlePattern } = req.body ?? {};
    if (!name || !pathPattern || !titlePattern) {
      return res
        .status(400)
        .json({ message: 'Name, path pattern and title pattern are required' });
    }
    if (!String(pathPattern).includes('{subject}')) {
      return res
        .status(400)
        .json({ message: 'Path pattern must include {subject} so each page has a unique URL' });
    }

    const template = await PseoTemplate.create({
      ...pickTemplateFields(req.body),
      createdBy: req.user._id,
    });
    await audit(req, 'SEO_PSEO_TEMPLATE_CREATED', 'PseoTemplate', template._id, { name });
    return res.status(201).json({ message: 'Template created successfully', template });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/admin/seo-tools/pseo/templates/:id — update a template. */
export async function updatePseoTemplate(req, res, next) {
  if (!requireAdmin(req, res)) return;
  try {
    const update = pickTemplateFields(req.body);
    if (update.pathPattern !== undefined && !String(update.pathPattern).includes('{subject}')) {
      return res
        .status(400)
        .json({ message: 'Path pattern must include {subject} so each page has a unique URL' });
    }
    const template = await PseoTemplate.findByIdAndUpdate(req.params.id, { $set: update }, {
      new: true,
      runValidators: true,
    });
    if (!template) return res.status(404).json({ message: 'Template not found' });
    await audit(req, 'SEO_PSEO_TEMPLATE_UPDATED', 'PseoTemplate', template._id);
    return res.status(200).json({ message: 'Template updated successfully', template });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/admin/seo-tools/pseo/templates/:id — remove a template and its pages. */
export async function deletePseoTemplate(req, res, next) {
  if (!requireAdmin(req, res)) return;
  try {
    const template = await PseoTemplate.findByIdAndDelete(req.params.id);
    if (!template) return res.status(404).json({ message: 'Template not found' });
    const removed = await PseoPage.deleteMany({ templateId: template._id });
    await audit(req, 'SEO_PSEO_TEMPLATE_DELETED', 'PseoTemplate', template._id, {
      pagesRemoved: removed.deletedCount,
    });
    noteSeoChange('generated pages');
    return res
      .status(200)
      .json({ message: `Template and ${removed.deletedCount} generated page(s) deleted` });
  } catch (err) {
    next(err);
  }
}

/** POST /api/admin/seo-tools/pseo/templates/:id/preview — show what would be generated. */
export async function previewPseoTemplate(req, res, next) {
  if (!requireAdmin(req, res)) return;
  try {
    const template = await PseoTemplate.findById(req.params.id).lean();
    if (!template) return res.status(404).json({ message: 'Template not found' });
    const pages = buildPagesForTemplate(template);
    return res.status(200).json({ total: pages.length, sample: pages.slice(0, 10) });
  } catch (err) {
    next(err);
  }
}

/** POST /api/admin/seo-tools/pseo/templates/:id/generate — create or refresh pages. */
export async function generatePseoPages(req, res, next) {
  if (!requireAdmin(req, res)) return;
  try {
    const result = await generatePagesForTemplate(req.params.id);
    await audit(req, 'SEO_PSEO_PAGES_GENERATED', 'PseoTemplate', req.params.id, result);
    noteSeoChange('generated pages');
    return res.status(200).json({
      message: `Generated ${result.created} new, updated ${result.updated}, skipped ${result.skipped} customised`,
      ...result,
    });
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ message: err.message });
    next(err);
  }
}

/** GET /api/admin/seo-tools/pseo/pages — list generated pages. */
export async function listPseoPages(req, res, next) {
  if (!requireAdmin(req, res)) return;
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const filter = {};
    if (req.query.templateId) filter.templateId = req.query.templateId;

    const [pages, totalCount] = await Promise.all([
      PseoPage.find(filter).sort({ path: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      PseoPage.countDocuments(filter),
    ]);
    return res.status(200).json({
      pages,
      pagination: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) },
    });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/admin/seo-tools/pseo/pages/:id — edit one generated page. */
export async function updatePseoPage(req, res, next) {
  if (!requireAdmin(req, res)) return;
  try {
    const { title, description, heading, intro, isActive } = req.body ?? {};
    const update = {};
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (heading !== undefined) update.heading = heading;
    if (intro !== undefined) update.intro = intro;
    if (isActive !== undefined) update.isActive = !!isActive;
    // Any manual edit protects the page from being overwritten on regeneration.
    if (Object.keys(update).some((key) => key !== 'isActive')) update.isCustomised = true;

    const pseoPage = await PseoPage.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!pseoPage) return res.status(404).json({ message: 'Page not found' });
    await audit(req, 'SEO_PSEO_PAGE_UPDATED', 'PseoPage', pseoPage._id, { path: pseoPage.path });
    noteSeoChange('generated pages');
    return res.status(200).json({ message: 'Page updated successfully', page: pseoPage });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/admin/seo-tools/pseo/pages/:id — remove one generated page. */
export async function deletePseoPage(req, res, next) {
  if (!requireAdmin(req, res)) return;
  try {
    const pseoPage = await PseoPage.findByIdAndDelete(req.params.id);
    if (!pseoPage) return res.status(404).json({ message: 'Page not found' });
    await audit(req, 'SEO_PSEO_PAGE_DELETED', 'PseoPage', pseoPage._id, { path: pseoPage.path });
    noteSeoChange('generated pages');
    return res.status(200).json({ message: 'Page deleted successfully' });
  } catch (err) {
    next(err);
  }
}

/* ---------------------------------------------------------------- dashboard */

/**
 * GET /api/admin/seo-tools/dashboard
 * Counts backing the SEO overview tab.
 */
export async function getSeoDashboard(req, res, next) {
  if (!requireAdmin(req, res)) return;
  try {
    const [redirects, activeRedirects, notFound, unresolved, templates, pseoPages, activePseo] =
      await Promise.all([
        Redirect.countDocuments(),
        Redirect.countDocuments({ isActive: true }),
        NotFoundLog.countDocuments(),
        NotFoundLog.countDocuments({ isResolved: false }),
        PseoTemplate.countDocuments(),
        PseoPage.countDocuments(),
        PseoPage.countDocuments({ isActive: true }),
      ]);

    const topMisses = await NotFoundLog.find({ isResolved: false })
      .sort({ hits: -1 })
      .limit(5)
      .select('path hits lastSeenAt')
      .lean();

    const [health, publish] = await Promise.all([seoHealth(), publishStatus()]);

    return res.status(200).json({
      redirects: { total: redirects, active: activeRedirects },
      notFound: { total: notFound, unresolved },
      pseo: { templates, pages: pseoPages, active: activePseo },
      topMisses,
      health,
      publish,
    });
  } catch (err) {
    next(err);
  }
}

/* ------------------------------------------------------------ health check */

/** Recommended limits Google tends to truncate beyond. */
const TITLE_MAX = 60;
const DESCRIPTION_MAX = 160;

/**
 * Search listing problems across every page the admin controls: missing or
 * over-long titles and descriptions, titles used twice, hidden pages, and the
 * Organization fields still empty.
 *
 * @returns {Promise<Object>}
 */
async function seoHealth() {
  const [configs, subjects, blogs, settings] = await Promise.all([
    PageSeo.find().select('path title description noindex').lean(),
    Subject.find().select('name slug seoTitle metaDescription').lean(),
    Blog.find({ status: 'PUBLISHED' }).select('slug title excerpt seoTitle metaDescription').lean(),
    getSeoSettings(),
  ]);

  // The title and description each page will actually show.
  const listings = [
    ...blogs.map((blog) => ({
      path: `/blog/${blog.slug}`,
      title: blog.seoTitle || `${blog.title} | Best Choice Tutors`,
      description: blog.metaDescription || blog.excerpt || '',
    })),
    ...subjects.map((subject) => ({
      path: `/tutors/subject/${subject.slug}`,
      title: subject.seoTitle || `${subject.name} Tutors | Best Choice Tutors`,
      description: subject.metaDescription,
      defaultDescription: !subject.metaDescription,
    })),
  ];
  for (const config of configs) {
    const existing = listings.find((item) => item.path === config.path);
    if (existing) {
      if (config.title) existing.title = config.title;
      if (config.description) {
        existing.description = config.description;
        existing.defaultDescription = false;
      }
      if (config.noindex) existing.hidden = true;
    } else {
      // A fixed page's override: the page keeps its own title and description
      // for anything the override leaves blank, so only what is set is checked.
      listings.push({
        path: config.path,
        title: config.title,
        description: config.description,
        overrideOnly: true,
        hidden: config.noindex,
      });
    }
  }

  const issues = [];
  const byTitle = new Map();
  for (const item of listings) {
    // Pages hidden from search have no listing to improve.
    if (item.hidden) continue;
    if (!item.title) {
      if (!item.overrideOnly) issues.push({ path: item.path, problem: 'No page title' });
    } else if (item.title.length > TITLE_MAX) {
      issues.push({ path: item.path, problem: `Title is ${item.title.length} characters (aim for ${TITLE_MAX} or fewer)` });
    }
    if (!item.description || item.defaultDescription) {
      if (!item.overrideOnly) issues.push({ path: item.path, problem: 'No meta description of its own' });
    } else if (item.description.length > DESCRIPTION_MAX) {
      issues.push({
        path: item.path,
        problem: `Description is ${item.description.length} characters (aim for ${DESCRIPTION_MAX} or fewer)`,
      });
    }
    if (item.title) {
      const key = item.title.trim().toLowerCase();
      byTitle.set(key, [...(byTitle.get(key) || []), item.path]);
    }
  }
  for (const paths of byTitle.values()) {
    if (paths.length > 1) {
      for (const path of paths) issues.push({ path, problem: `Same title as ${paths.filter((p) => p !== path).join(', ')}` });
    }
  }

  return {
    issues: issues.slice(0, 100),
    issueCount: issues.length,
    pagesChecked: listings.length,
    hiddenPages: configs.filter((config) => config.noindex).map((config) => config.path),
    organizationMissing: missingOrganizationFields(settings.toObject().organization || {}),
  };
}

/* ---------------------------------------------------------------- publishing */

/**
 * Whether a deploy hook is set, the last publish, and how many SEO records
 * changed since then.
 *
 * @returns {Promise<Object>}
 */
async function publishStatus() {
  const settings = await getSeoSettings();
  const last = settings.publish?.requestedAt || null;
  const since = last ? { updatedAt: { $gt: last } } : {};
  const [pages, redirects, subjects, blogs, settingsChanged] = await Promise.all([
    PageSeo.countDocuments(since),
    Redirect.countDocuments(since),
    Subject.countDocuments(since),
    // Drafts are not on the site, so editing one is not an unpublished change.
    Blog.countDocuments({ ...since, status: 'PUBLISHED' }),
    last ? SeoSetting.countDocuments({ singleton: 'global', updatedAt: { $gt: last } }) : 0,
  ]);
  return {
    configured: isPublishConfigured(),
    pending: isPublishPending() || Boolean(settings.publish?.pendingSince),
    last: settings.publish?.lastAttemptAt || last
      ? {
          at: settings.publish.lastAttemptAt || last,
          ok: settings.publish.ok,
          message: settings.publish.message,
          reason: settings.publish.reason,
          publishedAt: last,
        }
      : null,
    changesSinceLast: pages + redirects + subjects + blogs + settingsChanged,
  };
}

/**
 * POST /api/admin/seo-tools/publish
 * Rebuild the public site now, so recent SEO edits go live.
 */
export async function publishSite(req, res, next) {
  if (!requireAdmin(req, res)) return;
  try {
    const result = await publishNow('published from the SEO dashboard');
    await audit(req, 'SEO_SITE_PUBLISHED', 'SeoSetting', (await getSeoSettings())._id, { ok: result.ok });
    // Always 200 with ok set, so the dashboard can show the outcome either way.
    return res.status(200).json({ ...result, publish: await publishStatus() });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/seo-tools/known-paths
 * Every public page the site publishes, for path suggestions in the editors.
 */
export async function listKnownPaths(req, res, next) {
  if (!requireAdmin(req, res)) return;
  try {
    const { pages } = await collectBuildPaths();
    return res.status(200).json({ paths: pages.map((page) => page.path) });
  } catch (err) {
    next(err);
  }
}
