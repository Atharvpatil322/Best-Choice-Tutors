/**
 * SEO head service
 *
 * Works out every search-relevant tag for a URL - title, description,
 * canonical, robots, Open Graph, Twitter, verification and JSON-LD - from the
 * database, and writes those tags into an HTML document.
 *
 * It is the single source for page metadata in raw HTML. The frontend is
 * served as a static site, so the build calls GET /api/public/seo-head for
 * every public URL and writes the result into the files it publishes
 * (frontend/scripts/build-seo-pages.mjs). When Express serves the build
 * itself, renderSeoHtml applies the same head per request.
 */

import Blog from '../models/Blog.js';
import FAQ from '../models/FAQ.js';
import PageSeo from '../models/PageSeo.js';
import PopularSearch from '../models/PopularSearch.js';
import PseoPage from '../models/PseoPage.js';
import { getSeoSettings } from './seoContentService.js';
import { CANONICAL_SUBJECTS } from '../constants/subjects.js';
import { subjectToSlug } from '../utils/subjectSlug.js';
import {
  SITE_URL,
  BRAND_NAME,
  buildOrganizationSchema,
  buildWebSiteSchema,
  buildBreadcrumbSchema,
  buildServiceSchema,
  buildBlogPostingSchema,
  buildFaqSchema,
} from './seoSchemaBuilders.js';

const DEFAULT_TITLE = 'Best Choice Tutors - Expert Tutors. Real Results.';
const DEFAULT_DESCRIPTION =
  'Find expert tutors online and in-person for GCSE, A-Levels, university, languages and more. Safe payments, verified tutors, and flexible scheduling.';
const DEFAULT_KEYWORDS =
  'online tutors, GCSE tutors, A-Level tutors, university tutoring, language tutors, maths tutor, physics tutor, English tutor';
/**
 * Fallback share image. Social platforms show a bare link with no preview when
 * a page has no image, so every page gets one even if none is configured.
 */
const DEFAULT_OG_IMAGE = `${SITE_URL}/logo.png`;

/**
 * Subject page copy. Matches what frontend/src/pages/tutor/FindTutors.jsx
 * renders, so the raw HTML and the rendered page agree.
 */
const SUBJECT_DESCRIPTION =
  'Browse verified tutors, compare profiles and rates, and book the right tutor for your learning goals.';

/** Breadcrumb labels for fixed pages. */
const PAGE_LABELS = {
  '/about': 'About Us',
  '/contact': 'Contact',
  '/how-it-works': 'How It Works',
  '/privacy': 'Privacy Policy',
  '/terms': 'Terms and Conditions',
  '/blog': 'Blog',
  '/tutors': 'Find Tutors',
};

const SUBJECT_BY_SLUG = new Map(CANONICAL_SUBJECTS.map((name) => [subjectToSlug(name), name]));

/**
 * Canonical subject name for a URL slug, or null.
 *
 * @param {string} slug
 * @returns {string|null}
 */
export function subjectForSlug(slug) {
  return SUBJECT_BY_SLUG.get(String(slug || '').toLowerCase()) || null;
}

export function normalizePath(rawPath) {
  if (!rawPath || typeof rawPath !== 'string') return '/';
  let path = rawPath.trim().split('?')[0].split('#')[0];
  if (!path) return '/';
  if (!path.startsWith('/')) path = `/${path}`;
  if (path.length > 1) {
    path = path.replace(/\/+/g, '/').replace(/\/$/, '');
  }
  return path.toLowerCase();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Serialise JSON-LD so it can never close the surrounding script element.
 *
 * @param {Object} data
 * @returns {string}
 */
function safeJson(data) {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/**
 * Load everything the head for one path depends on.
 *
 * @param {string} path - Normalised path.
 * @returns {Promise<Object>}
 */
async function loadPageContext(path) {
  const blogMatch = /^\/blog\/([a-z0-9-]+)$/.exec(path);
  const subjectMatch = /^\/tutors\/subject\/([^/]+)$/.exec(path);
  const subject = subjectMatch ? subjectForSlug(subjectMatch[1]) : null;

  const [settings, config, blog, pseoPage, popularSearches] = await Promise.all([
    getSeoSettings(),
    PageSeo.findOne({ path }).lean(),
    blogMatch
      ? Blog.findOne({ slug: blogMatch[1], status: 'PUBLISHED' })
          .select('title excerpt author category publishedAt createdAt updatedAt imageUrl imageAlt slug')
          .lean()
      : null,
    PseoPage.findOne({ path, isActive: true }).select('title description heading subject').lean(),
    path === '/'
      ? PopularSearch.find({ isActive: true }).select('label query order').sort({ order: 1 }).lean()
      : [],
  ]);

  // FAQs are described only where FaqSection shows them: the general set on
  // the homepage and the unfiltered tutor search, a subject's own set on its
  // subject page and on generated pages for that subject.
  const faqSubject = subject || (pseoPage?.subject ? pseoPage.subject : null);
  let faqs = [];
  if (path === '/' || path === '/tutors') {
    faqs = await FAQ.find({ isActive: true, subject: null })
      .select('question answer')
      .sort({ order: 1, createdAt: -1 })
      .lean();
  } else if (faqSubject) {
    faqs = await FAQ.find({ isActive: true, subject: faqSubject })
      .select('question answer')
      .sort({ order: 1, createdAt: -1 })
      .lean();
  }

  return { settings, config, blog, pseoPage, subject, faqs, popularSearches };
}

/**
 * Breadcrumb trail for a path. Blog posts and subject pages get readable
 * names; the subject trail skips "/tutors/subject", which is not a page.
 *
 * @param {string} path
 * @param {Object} ctx - From loadPageContext.
 * @returns {Array<{ name: string, path: string }>}
 */
function breadcrumbTrail(path, ctx) {
  const home = { name: 'Home', path: '/' };
  if (path === '/') return [home];
  if (ctx.blog) {
    return [home, { name: 'Blog', path: '/blog' }, { name: ctx.blog.title, path }];
  }
  if (ctx.subject) {
    return [home, { name: 'Find Tutors', path: '/tutors' }, { name: `${ctx.subject} Tutors`, path }];
  }
  if (ctx.pseoPage) {
    return [home, { name: ctx.pseoPage.heading || ctx.pseoPage.title || 'Tutors', path }];
  }
  if (PAGE_LABELS[path]) return [home, { name: PAGE_LABELS[path], path }];

  const last = path.split('/').filter(Boolean).pop() || '';
  return [home, { name: last.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), path }];
}

/**
 * Work out the head for a URL.
 *
 * Each entry carries the finished tag and an `owned` flag. Owned tags always
 * replace whatever a page already has. The rest - title, description and Open
 * Graph copy that fall back to site defaults - only fill gaps on pages the
 * build prerendered, because those pages already carry their own written copy
 * and the default would be worse.
 *
 * @param {string} requestPath
 * @param {{ noindex?: boolean }} [options] - `noindex` marks a path that
 *   resolves to no page.
 * @returns {Promise<{ path: string, entries: Array<{ key: string, html: string, owned: boolean }> }>}
 */
export async function buildSeoHead(requestPath, options = {}) {
  const path = normalizePath(requestPath);
  const ctx = await loadPageContext(path);
  const { settings, config, blog, pseoPage, subject } = ctx;
  const organization =
    (typeof settings?.toObject === 'function' ? settings.toObject() : settings)?.organization ?? {};

  // Precedence: an explicit admin override wins, then the record behind the
  // page (article, generated page, subject), then the site default.
  const recordTitle =
    (blog && `${blog.title} | ${BRAND_NAME}`) ||
    pseoPage?.title ||
    (subject && `${subject} Tutors | ${BRAND_NAME}`) ||
    null;
  const recordDescription =
    blog?.excerpt || pseoPage?.description || (subject ? SUBJECT_DESCRIPTION : null) || null;
  const recordOgTitle = blog?.title || null;

  const title = config?.title || recordTitle || DEFAULT_TITLE;
  const titleOwned = Boolean(config?.title || recordTitle);
  const description = config?.description || recordDescription || DEFAULT_DESCRIPTION;
  const descriptionOwned = Boolean(config?.description || recordDescription);
  const keywords = config?.keywords || DEFAULT_KEYWORDS;
  const canonicalUrl = config?.canonicalUrl || `${SITE_URL}${path === '/' ? '/' : path}`;
  const ogTitle = config?.ogTitle || recordOgTitle || title;
  const ogDescription = config?.ogDescription || description;
  const ogType = config?.ogType || (blog ? 'article' : 'website');
  const ogImage = config?.ogImage || blog?.imageUrl || DEFAULT_OG_IMAGE;
  const ogImageOwned = Boolean(config?.ogImage || blog?.imageUrl);
  const ogImageAlt = (blog?.imageUrl && blog?.imageAlt) || ogTitle;
  const robots = config?.noindex || options.noindex ? 'noindex, nofollow' : 'index, follow';

  const entries = [];
  const add = (key, html, owned) => entries.push({ key, html, owned });
  const meta = (attr, name, content, owned) =>
    add(`${attr}:${name}`, `<meta ${attr}="${name}" content="${escapeHtml(content)}" />`, owned);

  add('title', `<title>${escapeHtml(title)}</title>`, titleOwned);
  meta('name', 'description', description, descriptionOwned);
  meta('name', 'keywords', keywords, Boolean(config?.keywords));
  meta('name', 'robots', robots, true);
  add('canonical', `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`, true);
  meta('property', 'og:title', ogTitle, titleOwned || Boolean(config?.ogTitle));
  meta('property', 'og:description', ogDescription, descriptionOwned || Boolean(config?.ogDescription));
  meta('property', 'og:type', ogType, Boolean(config?.ogType || blog));
  meta('property', 'og:url', `${SITE_URL}${path === '/' ? '/' : path}`, true);
  meta('property', 'og:site_name', BRAND_NAME, true);
  meta('property', 'og:image', ogImage, ogImageOwned);
  meta('property', 'og:image:alt', ogImageAlt, ogImageOwned);
  // X reads og:title, og:description and og:image when its own tags are
  // absent, so only the card type is declared - repeating the copy would go
  // stale on pages whose title is not known here.
  meta('name', 'twitter:card', 'summary_large_image', true);

  // Search-engine ownership verification, editable from the admin panel.
  const verificationTags = [
    ['google-site-verification', settings?.verification?.google],
    ['msvalidate.01', settings?.verification?.bing],
    ['p:domain_verify', settings?.verification?.pinterest],
    ['yandex-verification', settings?.verification?.yandex],
  ];
  for (const [metaName, token] of verificationTags) {
    if (token) meta('name', metaName, token, true);
  }

  // Structured-data types an admin has switched off are skipped entirely.
  // A missing toggle defaults to on, so existing sites keep their schema.
  const toggles = settings?.schemaToggles ?? {};
  const enabled = (type) => toggles[type] !== false;
  const schemas = [];
  if (path === '/' && enabled('organization')) {
    schemas.push(buildOrganizationSchema(organization), buildWebSiteSchema(organization));
  }
  if (path === '/' && enabled('service')) {
    const subjects = ctx.popularSearches.map((entry) => entry.query || entry.label).filter(Boolean);
    schemas.push(buildServiceSchema(subjects));
  }
  if (blog && enabled('article')) schemas.push(buildBlogPostingSchema(blog, organization));
  if (enabled('breadcrumb')) schemas.push(buildBreadcrumbSchema(breadcrumbTrail(path, ctx)));
  if (enabled('faq')) schemas.push(buildFaqSchema(ctx.faqs));

  const jsonLd = schemas
    .filter(Boolean)
    .map((schema) => `<script type="application/ld+json">${safeJson(schema)}</script>`)
    .join('\n');
  // Owned even when empty, so a switched-off type is also removed from a page
  // that was prerendered with it.
  add('jsonld', jsonLd, true);

  return { path, entries };
}

/**
 * Pattern matching every existing copy of the tag an entry manages.
 *
 * Kept in step with frontend/scripts/build-seo-pages.mjs, which applies the
 * same entries at build time.
 *
 * @param {string} key
 * @returns {RegExp} Global, case-insensitive.
 */
export function patternForKey(key) {
  if (key === 'title') return /<title\b[^>]*>[\s\S]*?<\/title>/gi;
  if (key === 'canonical') return /<link\b[^>]*\brel=["']canonical["'][^>]*>/gi;
  if (key === 'jsonld') return /<script\b[^>]*\btype=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi;
  const [attr, ...rest] = key.split(':');
  const name = rest.join(':').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`<meta\\b[^>]*\\b${attr}=["']${name}["'][^>]*>`, 'gi');
}

/**
 * Write head entries into a document.
 *
 * Every existing copy of a managed tag is removed before the new one goes in,
 * so a page never ends up with two canonicals or two descriptions - whether
 * the copies came from index.html, from Helmet during prerendering, or both.
 * On a prerendered page, an entry that is not owned is skipped when the page
 * already has that tag.
 *
 * @param {string} html
 * @param {Array<{ key: string, html: string, owned: boolean }>} entries
 * @param {{ prerendered?: boolean }} [options]
 * @returns {string}
 */
export function applySeoHead(html, entries, options = {}) {
  let result = html;
  for (const entry of entries) {
    const pattern = patternForKey(entry.key);
    const exists = new RegExp(pattern.source, 'i').test(result);
    if (options.prerendered && exists && !entry.owned) continue;
    result = result.replace(pattern, '');
    if (entry.html) {
      // A function replacer, so "$&" or "$1" inside the markup is never
      // treated as a substitution pattern.
      result = result.replace(/<\/head>/i, () => `${entry.html}\n</head>`);
    }
  }
  return result;
}

/**
 * Apply the head for a path to a document served by Express.
 *
 * @param {string} indexHtml - The HTML file being served.
 * @param {string} requestPath - Path being served.
 * @param {{ noindex?: boolean, prerendered?: boolean }} [options]
 * @returns {Promise<string>}
 */
export async function renderSeoHtml(indexHtml, requestPath, options = {}) {
  const head = await buildSeoHead(requestPath, options);
  return applySeoHead(indexHtml, head.entries, options);
}
