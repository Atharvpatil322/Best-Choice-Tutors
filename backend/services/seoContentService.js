/**
 * SEO Content Service
 * Builds robots.txt, sitemap.xml and llms.txt from live database content
 * instead of static files, so newly published blog posts, FAQs and page-level
 * SEO overrides appear to crawlers without a redeploy.
 *
 * Only publicly reachable routes are advertised. Authenticated areas
 * (/dashboard, /tutor, /admin) and credential pages (/login, /register) are
 * deliberately excluded: crawlers cannot render them, so listing them wastes
 * crawl budget and produces soft-404s.
 */

import Blog from '../models/Blog.js';
import FAQ from '../models/FAQ.js';
import PageSeo from '../models/PageSeo.js';
import Benefit from '../models/Benefit.js';
import PseoPage from '../models/PseoPage.js';
import SeoSetting from '../models/SeoSetting.js';
import { CANONICAL_SUBJECTS } from '../constants/subjects.js';
import { subjectToSlug } from '../utils/subjectSlug.js';

/** Public site origin. Overridable so staging advertises its own hostname. */
const SITE_URL = (process.env.SITE_URL || 'https://bestchoicetutors.com').replace(/\/+$/, '');

/**
 * Routes that are publicly reachable without authentication, with the relative
 * crawl priority and change cadence to advertise for each.
 * Kept in sync with the router definitions in frontend/src/App.jsx.
 */
const PUBLIC_ROUTES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/about', changefreq: 'monthly', priority: '0.7' },
  { path: '/how-it-works', changefreq: 'monthly', priority: '0.8' },
  { path: '/contact', changefreq: 'monthly', priority: '0.6' },
  { path: '/blog', changefreq: 'daily', priority: '0.9' },
  { path: '/tutors', changefreq: 'daily', priority: '0.9' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' },
  // One entry per subject, matching the URLs the tutor search actually serves.
  ...CANONICAL_SUBJECTS.map((subject) => ({
    path: `/tutors/subject/${subjectToSlug(subject)}`,
    changefreq: 'weekly',
    priority: '0.8',
  })),
];

/**
 * Path prefixes that must never be advertised to crawlers, either because they
 * require a session or because they expose credential and callback flows.
 */
const DISALLOWED_PREFIXES = [
  '/admin',
  '/dashboard',
  // '/tutor' is the signed-in tutor area. '/tutors' is the public search and
  // its subject pages, which must stay crawlable, so the prefix match below
  // deliberately does not cover it.
  '/tutor',
  '/api',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth',
  '/onboarding',
  '/age-consent',
];

/**
 * The Disallow lines written into robots.txt.
 *
 * These are not the same strings as DISALLOWED_PREFIXES, because robots.txt
 * matches on raw prefixes with no notion of path segments: a bare
 * `Disallow: /tutor` also blocks /tutors, which is the public search. So the
 * signed-in tutor area is expressed as `/tutor/` for everything beneath it plus
 * `/tutor$` for the exact path, leaving /tutors and its subject pages
 * crawlable. Every other prefix is safe to write as-is, where blocking the
 * path and everything under it is exactly what is wanted.
 */
const ROBOTS_DISALLOW = DISALLOWED_PREFIXES.flatMap((prefix) =>
  prefix === '/tutor' ? ['/tutor/', '/tutor$'] : [prefix],
);

/**
 * Crawlers granted explicit access, covering search engines, social link
 * unfurlers and AI assistants. Listing them individually documents intent and
 * survives a future tightening of the catch-all rule.
 */
const ALLOWED_CRAWLERS = [
  'Googlebot',
  'Googlebot-Image',
  'Google-Extended',
  'Bingbot',
  'Applebot',
  'Twitterbot',
  'Facebot',
  'Pinterest',
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'PerplexityBot',
  'CCBot',
];

/**
 * Load the site-wide SEO settings, creating the document on first use so the
 * admin panel always has something to edit.
 *
 * @returns {Promise<Object>} The SeoSetting document.
 */
export async function getSeoSettings() {
  let settings = await SeoSetting.findOne({ singleton: 'global' });
  if (!settings) {
    settings = await SeoSetting.create({ singleton: 'global' });
  }
  return settings;
}

/**
 * Escape the five characters that are not legal as raw text in XML.
 * Applied to every database-sourced value placed inside sitemap elements.
 *
 * @param {unknown} value - Raw value to escape.
 * @returns {string} XML-safe text.
 */
function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Determine whether a path is safe to advertise to crawlers.
 *
 * @param {string} path - Site-relative path beginning with a slash.
 * @returns {boolean} True when the path is public and indexable.
 */
function isPublicPath(path) {
  if (typeof path !== 'string' || !path.startsWith('/')) return false;
  return !DISALLOWED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

/**
 * Format a date as the W3C date string (YYYY-MM-DD) required by <lastmod>.
 * Falls back to today when the value is missing or unparseable.
 *
 * @param {Date|string|null|undefined} value - Source timestamp.
 * @returns {string} Date in YYYY-MM-DD form.
 */
function toSitemapDate(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

/**
 * Collect every indexable URL: the fixed public routes, published blog posts,
 * and any additional public paths configured in the SEO manager.
 * Duplicates are removed, with the first occurrence winning.
 *
 * @returns {Promise<Array<{ path: string, lastmod: string, changefreq: string, priority: string }>>}
 */
async function collectSitemapEntries() {
  const settings = await getSeoSettings();
  const [publishedBlogs, seoConfigs, pseoPages] = await Promise.all([
    settings.sitemapIncludeBlogs
      ? Blog.find({ status: 'PUBLISHED' })
          .select('slug publishedAt updatedAt')
          .sort({ publishedAt: -1 })
          .lean()
      : Promise.resolve([]),
    PageSeo.find().select('path updatedAt').lean(),
    settings.sitemapIncludePseo
      ? PseoPage.find({ isActive: true }).select('path updatedAt').lean()
      : Promise.resolve([]),
  ]);

  // No lastmod for these: their content is not tracked with a timestamp, and a
  // date that silently changes to "today" on every request teaches crawlers to
  // ignore the field. Omitting it is valid and honest.
  const entries = PUBLIC_ROUTES.map((route) => ({
    path: route.path,
    lastmod: null,
    changefreq: route.changefreq,
    priority: route.priority,
  }));

  for (const blog of publishedBlogs) {
    if (!blog.slug) continue;
    entries.push({
      path: `/blog/${blog.slug}`,
      lastmod: toSitemapDate(blog.updatedAt || blog.publishedAt),
      changefreq: 'weekly',
      priority: '0.8',
    });
  }

  // Page-level SEO overrides may describe landing pages not present in the
  // fixed list (for example campaign or subject pages added by the SEO team).
  for (const config of seoConfigs) {
    entries.push({
      path: config.path,
      lastmod: toSitemapDate(config.updatedAt),
      changefreq: 'monthly',
      priority: '0.6',
    });
  }

  for (const pseoPage of pseoPages) {
    entries.push({
      path: pseoPage.path,
      lastmod: toSitemapDate(pseoPage.updatedAt),
      changefreq: 'weekly',
      priority: '0.7',
    });
  }

  const excluded = new Set((settings.sitemapExcludePaths || []).map((p) => p.replace(/\/+$/, '')));

  const seen = new Set();
  return entries.filter((entry) => {
    if (!isPublicPath(entry.path)) return false;
    if (excluded.has(entry.path.replace(/\/+$/, ''))) return false;
    const normalized = entry.path === '/' ? '/' : entry.path.replace(/\/+$/, '');
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

/**
 * Build the sitemap XML document advertised to search engines.
 *
 * @returns {Promise<string>} Complete urlset document.
 */
export async function buildSitemapXml() {
  const entries = await collectSitemapEntries();

  const urlElements = entries
    .map((entry) => {
      const normalized = entry.path === '/' ? '/' : entry.path.replace(/\/+$/, '');
      return [
        '  <url>',
        `    <loc>${escapeXml(`${SITE_URL}${normalized}`)}</loc>`,
        // Emitted only when a real modification date is known.
        ...(entry.lastmod ? [`    <lastmod>${entry.lastmod}</lastmod>`] : []),
        `    <changefreq>${entry.changefreq}</changefreq>`,
        `    <priority>${entry.priority}</priority>`,
        '  </url>',
      ].join('\n');
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urlElements,
    '</urlset>',
    '',
  ].join('\n');
}

/**
 * Build robots.txt. Private areas are disallowed for every crawler, and the
 * sitemap location is advertised so search engines can discover it.
 *
 * Non-production environments return a blanket disallow so staging copies are
 * never indexed alongside the live site.
 *
 * @returns {string} robots.txt body.
 */
export async function buildRobotsTxt() {
  const settings = await getSeoSettings();

  // An override is served exactly as typed. Nothing is generated around it, so
  // the admin panel and the served file can never disagree.
  const override = String(settings.robotsOverride || '').trim();
  if (override) return `${override}\n`;

  // 'auto' allows crawling only in production, so preview and staging copies
  // are never indexed alongside the live site.
  const allowCrawling =
    settings.robotsMode === 'allow' ||
    (settings.robotsMode === 'auto' && process.env.NODE_ENV === 'production');

  if (!allowCrawling) {
    return ['User-agent: *', 'Disallow: /', ''].join('\n');
  }

  const disallowLines = ROBOTS_DISALLOW.map((rule) => `Disallow: ${rule}`);

  const lines = ['User-agent: *', ...disallowLines, ''];

  for (const crawler of ALLOWED_CRAWLERS) {
    lines.push(`User-agent: ${crawler}`, 'Allow: /', ...disallowLines, '');
  }

  lines.push(`Sitemap: ${SITE_URL}/sitemap.xml`, '');

  return lines.join('\n');
}

/**
 * Build llms.txt, the proposed plain-text site summary for AI assistants.
 * Generated from live content so published posts and active FAQs are reflected
 * without editing a static file.
 *
 * @returns {Promise<string>} Markdown-formatted llms.txt body.
 */
export async function buildLlmsTxt() {
  const [publishedBlogs, activeFaqs, activeBenefits] = await Promise.all([
    Blog.find({ status: 'PUBLISHED' })
      .select('title slug excerpt publishedAt')
      .sort({ publishedAt: -1 })
      .limit(50)
      .lean(),
    FAQ.find({ isActive: true })
      .select('question answer order')
      .sort({ order: 1 })
      .lean(),
    Benefit.find({ isActive: true })
      .select('title description order')
      .sort({ order: 1 })
      .lean(),
  ]);

  const settings = await getSeoSettings();
  const customIntro = String(settings.llmsIntro || '').trim();
  const introLines = customIntro
    ? customIntro.split('\n').map((line) => `> ${line.trim()}`)
    : [
        '> Best Choice Tutors is a UK tutoring marketplace connecting students with verified,',
        '> DBS-checked tutors for GCSE, A-Levels, university and language subjects.',
        '> Sessions run online or in person, with secure payments and flexible scheduling.',
      ];

  const sections = [
    '# Best Choice Tutors',
    '',
    ...introLines,
    '',
    `> Website: ${SITE_URL}`,
    `> Last updated: ${new Date().toISOString().slice(0, 10)}`,
    '',
    '## Public pages',
    '',
  ];

  for (const route of PUBLIC_ROUTES) {
    sections.push(`- [${describeRoute(route.path)}](${SITE_URL}${route.path})`);
  }

  if (activeBenefits.length > 0) {
    sections.push('', '## Why families choose us', '');
    for (const benefit of activeBenefits) {
      sections.push(`- **${benefit.title}**: ${benefit.description}`);
    }
  }

  if (publishedBlogs.length > 0) {
    sections.push('', '## Articles', '');
    for (const blog of publishedBlogs) {
      const summary = blog.excerpt ? `: ${blog.excerpt}` : '';
      sections.push(`- [${blog.title}](${SITE_URL}/blog/${blog.slug})${summary}`);
    }
  }

  if (activeFaqs.length > 0) {
    sections.push('', '## Frequently asked questions', '');
    for (const faq of activeFaqs) {
      sections.push(`### ${faq.question}`, faq.answer, '');
    }
  }

  return sections.join('\n');
}

/**
 * Human-readable label for a public route, used in the llms.txt page listing.
 *
 * @param {string} path - Site-relative path.
 * @returns {string} Display label.
 */
function describeRoute(path) {
  const labels = {
    '/': 'Home - search tutors by subject and location',
    '/about': 'About Best Choice Tutors',
    '/how-it-works': 'How it works - finding and booking a tutor',
    '/contact': 'Contact and support',
    '/blog': 'Blog - tutoring guides and study advice',
    '/privacy': 'Privacy policy',
    '/terms': 'Terms and conditions',
  };
  return labels[path] || path;
}
