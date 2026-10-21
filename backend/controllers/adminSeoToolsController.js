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
  return String(value ?? '').trim();
}

/**
 * A list of trimmed, non-empty strings from an array or a newline-separated
 * string.
 *
 * @param {unknown} value
 * @returns {string[]}
 */
function cleanList(value) {
  const list = Array.isArray(value) ? value : String(value ?? '').split('\n');
  return list.map(cleanText).filter(Boolean);
}

/**
 * Accept an absolute http(s) URL or a site-relative path; blank stays blank.
 *
 * @param {string} label - Field name for the error message.
 * @param {unknown} value
 * @returns {string}
 */
function cleanUrl(label, value) {
  const url = cleanText(value);
  if (!url) return '';
  if (/^https?:\/\/[^\s]+$/i.test(url) || /^\/[^\s]*$/.test(url)) return url;
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
  if (out.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email)) {
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
    out.contactPoints = input.contactPoints.slice(0, 10).map((point) => ({
      contactType: cleanText(point?.contactType),
      telephone: cleanText(point?.telephone),
      email: cleanText(point?.email),
      areaServed: cleanText(point?.areaServed),
      availableLanguage: cleanList(point?.availableLanguage),
    }));
  }

  if (input.openingHours !== undefined) {
    if (!Array.isArray(input.openingHours)) throw new SettingsValidationError('Opening hours must be a list');
    out.openingHours = input.openingHours.slice(0, 14).map((slot) => {
      const days = cleanList(slot?.days).filter((day) => WEEK_DAYS.includes(day));
      const opens = cleanText(slot?.opens);
      const closes = cleanText(slot?.closes);
      const time = /^([01]\d|2[0-3]):[0-5]\d$/;
      if ((opens && !time.test(opens)) || (closes && !time.test(closes))) {
        throw new SettingsValidationError('Opening and closing times must be HH:MM, for example 09:00');
      }
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
    const source = matchType === 'regex' ? String(sourcePath ?? '').trim() : normalisePath(sourcePath);
    const target = normalisePath(targetUrl);

    if (!source || !target) {
      return res.status(400).json({ message: 'Source path and target URL are required' });
    }
    if (source === target) {
      return res.status(400).json({ message: 'Source and target cannot be the same — this would loop' });
    }
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
      statusCode: statusCode ?? 301,
      matchType: matchType ?? 'exact',
      note: note ?? '',
      isActive: isActive === undefined ? true : !!isActive,
      createdBy: req.user._id,
    });

    // A redirect now exists for this path, so it is no longer an unresolved miss.
    await NotFoundLog.updateOne({ path: source }, { $set: { isResolved: true } });
    await audit(req, 'SEO_REDIRECT_CREATED', 'Redirect', redirect._id, { sourcePath: source });

    return res.status(201).json({ message: 'Redirect created successfully', redirect });
  } catch (err) {
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
    if (matchType !== undefined) redirect.matchType = matchType;
    if (sourcePath !== undefined) {
      redirect.sourcePath =
        redirect.matchType === 'regex' ? String(sourcePath).trim() : normalisePath(sourcePath);
    }
    if (targetUrl !== undefined) redirect.targetUrl = normalisePath(targetUrl);
    if (statusCode !== undefined) redirect.statusCode = statusCode;
    if (note !== undefined) redirect.note = note;
    if (isActive !== undefined) redirect.isActive = !!isActive;

    if (redirect.sourcePath === redirect.targetUrl) {
      return res.status(400).json({ message: 'Source and target cannot be the same — this would loop' });
    }

    await redirect.save();
    await audit(req, 'SEO_REDIRECT_UPDATED', 'Redirect', redirect._id);
    return res.status(200).json({ message: 'Redirect updated successfully', redirect });
  } catch (err) {
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
      ...req.body,
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
    const template = await PseoTemplate.findByIdAndUpdate(req.params.id, req.body, {
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

    return res.status(200).json({
      redirects: { total: redirects, active: activeRedirects },
      notFound: { total: notFound, unresolved },
      pseo: { templates, pages: pseoPages, active: activePseo },
      topMisses,
    });
  } catch (err) {
    next(err);
  }
}
