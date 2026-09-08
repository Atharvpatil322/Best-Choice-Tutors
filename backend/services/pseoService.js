/**
 * Programmatic SEO service
 *
 * Expands a PseoTemplate into one landing page per subject/location pair.
 * These pages target the specific phrases parents search ("gcse maths tutors
 * in london") which the generic tutor search page cannot rank for.
 *
 * Generation is idempotent: re-running updates existing pages in place rather
 * than duplicating them, and never touches a page an admin has edited by hand.
 */

import PseoPage from '../models/PseoPage.js';
import PseoTemplate from '../models/PseoTemplate.js';

/** Upper bound on generated pages per run, guarding against runaway templates. */
const MAX_PAGES_PER_TEMPLATE = 2000;

/**
 * Convert a value into a URL-safe slug.
 *
 * @param {string} value - Raw value, e.g. "Computer Science".
 * @returns {string} Slug, e.g. "computer-science".
 */
export function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Title-case a value for display inside generated copy.
 *
 * @param {string} value
 * @returns {string}
 */
function titleCase(value) {
  return String(value ?? '')
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Substitute {subject} / {location} placeholders in a pattern.
 * Lower-case placeholders insert the value as entered; capitalised ones insert
 * a title-cased form. Path patterns additionally slugify each substitution.
 *
 * @param {string} pattern - Pattern containing placeholders.
 * @param {{ subject: string, location: string }} values
 * @param {boolean} [asSlug=false] - Slugify substituted values (for paths).
 * @returns {string}
 */
export function fillPattern(pattern, values, asSlug = false) {
  const subject = asSlug ? slugify(values.subject) : values.subject;
  const location = asSlug ? slugify(values.location) : values.location;
  return String(pattern ?? '')
    .replace(/\{subject\}/g, subject)
    .replace(/\{location\}/g, location)
    .replace(/\{Subject\}/g, asSlug ? subject : titleCase(values.subject))
    .replace(/\{Location\}/g, asSlug ? location : titleCase(values.location));
}

/**
 * Build the page records a template would produce, without writing anything.
 * Used both by the generator and by the admin preview.
 *
 * @param {Object} template - PseoTemplate document.
 * @returns {Array<Object>} Page payloads, capped at MAX_PAGES_PER_TEMPLATE.
 */
export function buildPagesForTemplate(template) {
  const subjects = (template.subjects || []).filter(Boolean);
  const locations = (template.locations || []).filter(Boolean);
  if (subjects.length === 0) return [];

  // A template may vary subject only; represent that as a single empty location.
  const locationList = locations.length > 0 ? locations : [''];

  const pages = [];
  for (const subject of subjects) {
    for (const location of locationList) {
      if (pages.length >= MAX_PAGES_PER_TEMPLATE) return pages;
      const values = { subject, location };
      let path = fillPattern(template.pathPattern, values, true);
      if (!path.startsWith('/')) path = `/${path}`;
      // Collapse artefacts left by an empty location, e.g. "-in-" with nothing after.
      path = path.replace(/-+/g, '-').replace(/-\/$/, '/').replace(/-$/, '');

      pages.push({
        path: path.toLowerCase(),
        subject,
        location,
        title: fillPattern(template.titlePattern, values),
        description: fillPattern(template.descriptionPattern, values),
        heading: fillPattern(template.headingPattern, values),
        intro: fillPattern(template.introPattern, values),
      });
    }
  }
  return pages;
}

/**
 * Generate or refresh every page for a template.
 *
 * Pages flagged `isCustomised` are left untouched so bespoke copy written by an
 * admin survives regeneration.
 *
 * @param {string} templateId - PseoTemplate id.
 * @returns {Promise<{ created: number, updated: number, skipped: number, total: number }>}
 */
export async function generatePagesForTemplate(templateId) {
  const template = await PseoTemplate.findById(templateId);
  if (!template) {
    const error = new Error('Template not found');
    error.statusCode = 404;
    throw error;
  }

  const payloads = buildPagesForTemplate(template);
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const payload of payloads) {
    const existing = await PseoPage.findOne({ path: payload.path });

    if (!existing) {
      await PseoPage.create({ ...payload, templateId: template._id });
      created += 1;
      continue;
    }

    if (existing.isCustomised) {
      skipped += 1;
      continue;
    }

    existing.set({ ...payload, templateId: template._id });
    await existing.save();
    updated += 1;
  }

  template.lastGeneratedAt = new Date();
  template.lastGeneratedCount = payloads.length;
  await template.save();

  return { created, updated, skipped, total: payloads.length };
}

/**
 * Fetch an active generated page by path.
 *
 * @param {string} path - Site-relative path.
 * @returns {Promise<Object|null>}
 */
export async function findActivePseoPage(path) {
  if (!path || typeof path !== 'string') return null;
  return PseoPage.findOne({ path: path.toLowerCase(), isActive: true }).lean();
}
