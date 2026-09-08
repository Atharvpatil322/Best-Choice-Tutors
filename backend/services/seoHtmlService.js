import Blog from '../models/Blog.js';
import FAQ from '../models/FAQ.js';
import PageSeo from '../models/PageSeo.js';
import PopularSearch from '../models/PopularSearch.js';
import PseoPage from '../models/PseoPage.js';
import { getSeoSettings } from './seoContentService.js';

const SITE_URL = 'https://bestchoicetutors.com';
const DEFAULT_TITLE = 'Best Choice Tutors - Expert Tutors. Real Results.';
const DEFAULT_DESCRIPTION =
  'Find expert tutors online and in-person for GCSE, A-Levels, university, languages and more. Safe payments, verified tutors, and flexible scheduling.';
/**
 * Fallback share image. Social platforms show a bare link with no preview when
 * a page has no image, so every page gets one even if none is configured.
 */
const DEFAULT_OG_IMAGE = `${SITE_URL}/logo.png`;

const DEFAULT_KEYWORDS =
  'online tutors, GCSE tutors, A-Level tutors, university tutoring, language tutors, maths tutor, physics tutor, English tutor';

function normalizePath(rawPath) {
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

function safeJson(data) {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/**
 * Replace an existing head tag, or insert it before </head> when absent.
 *
 * Function replacers are used deliberately: a string replacement would treat
 * `$&`, `$'` and `$1` inside the markup as substitution patterns and splice
 * surrounding page HTML into the tag.
 *
 * @param {string} html - Document to modify.
 * @param {RegExp} tagRegex - Matches the existing tag, if present.
 * @param {string} tagMarkup - Fully-formed replacement tag.
 * @returns {string} Updated document.
 */
function upsertTag(html, tagRegex, tagMarkup) {
  if (tagRegex.test(html)) {
    return html.replace(tagRegex, () => tagMarkup);
  }
  return html.replace('</head>', () => `    ${tagMarkup}\n  </head>`);
}

/**
 * Build BlogPosting structured data so article pages are eligible for rich
 * results. Returns null when the path is not a published blog post.
 *
 * @param {string} path - Normalised request path.
 * @returns {Promise<Object|null>} JSON-LD object, or null when not applicable.
 */
async function findPublishedBlogForPath(path) {
  const match = /^\/blog\/([a-z0-9-]+)$/.exec(path);
  if (!match) return null;
  return Blog.findOne({ slug: match[1], status: 'PUBLISHED' })
    .select('title excerpt author publishedAt updatedAt imageUrl imageAlt slug')
    .lean();
}

/**
 * Human-readable labels for path segments that do not read well when
 * mechanically title-cased (for example "faq" would become "Faq").
 */
const BREADCRUMB_LABELS = {
  blog: 'Blog',
  about: 'About Us',
  contact: 'Contact',
  terms: 'Terms and Conditions',
  privacy: 'Privacy Policy',
  'how-it-works': 'How It Works',
};

/**
 * Build BreadcrumbList structured data for the current path so search results
 * can show the page's position in the site hierarchy instead of a bare URL.
 * Returns null for the homepage, where a single-item trail adds nothing.
 *
 * @param {string} path - Normalised request path.
 * @param {Object|null} blog - Published blog record when the path is an article.
 * @returns {Object|null} JSON-LD object, or null when not applicable.
 */
function buildBreadcrumbSchema(path, blog) {
  if (path === '/') return null;

  const segments = path.split('/').filter(Boolean);
  const items = [{ name: 'Home', url: `${SITE_URL}/` }];

  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLastSegment = index === segments.length - 1;
    // An article's final crumb reads better as the post title than its slug.
    const name =
      isLastSegment && blog
        ? blog.title
        : BREADCRUMB_LABELS[segment] ||
          segment.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
    items.push({ name, url: `${SITE_URL}${currentPath}` });
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Build Service structured data describing the tutoring offering, listing the
 * subjects currently advertised in the popular-search shortcuts so the schema
 * tracks what the site actually promotes.
 *
 * @param {Array<Object>} popularSearches - Active popular-search records.
 * @returns {Object} JSON-LD object.
 */
function buildServiceSchema(popularSearches) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Tutoring',
    name: 'Private Tutoring - Best Choice Tutors',
    description:
      'One-to-one online and in-person tutoring with verified, DBS-checked tutors for GCSE, A-Levels, university and language subjects.',
    provider: {
      '@type': 'EducationalOrganization',
      name: 'Best Choice Tutors',
      url: SITE_URL,
    },
    areaServed: { '@type': 'Country', name: 'United Kingdom' },
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: SITE_URL,
      availableLanguage: { '@type': 'Language', name: 'English' },
    },
  };

  const subjects = popularSearches
    .map((entry) => entry.query || entry.label)
    .filter(Boolean);

  if (subjects.length > 0) {
    schema.hasOfferCatalog = {
      '@type': 'OfferCatalog',
      name: 'Tutoring subjects',
      itemListElement: subjects.map((subject) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: `${subject} tutoring` },
      })),
    };
  }

  return schema;
}

/**
 * Build BlogPosting structured data from an already-loaded blog record.
 *
 * @param {Object|null} blog - Published blog document, or null.
 * @returns {Object|null} JSON-LD object, or null when no blog was supplied.
 */
function buildBlogPostingSchema(blog) {
  if (!blog) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    description: blog.excerpt || undefined,
    author: { '@type': 'Organization', name: blog.author || 'Best Choice Tutors' },
    publisher: {
      '@type': 'Organization',
      name: 'Best Choice Tutors',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${blog.slug}` },
  };
  if (blog.publishedAt) schema.datePublished = new Date(blog.publishedAt).toISOString();
  if (blog.updatedAt) schema.dateModified = new Date(blog.updatedAt).toISOString();
  if (blog.imageUrl) {
    schema.image = blog.imageAlt
      ? { '@type': 'ImageObject', url: blog.imageUrl, caption: blog.imageAlt }
      : blog.imageUrl;
  }
  return schema;
}

function buildFAQSchema(faqs) {
  if (!faqs.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Remove SEO tags that react-helmet-async baked into the prerendered HTML.
 *
 * The build prerenders each route with a real browser, so Helmet's title,
 * description, Open Graph and JSON-LD tags end up in the saved file. This
 * function then injects its own, which would leave two of each - and duplicate
 * canonical or JSON-LD blocks are an indexing error, not a cosmetic one.
 *
 * Helmet marks everything it manages with `data-rh="true"`, so those tags are
 * stripped and the server-rendered set becomes the single source of truth.
 * Tags written directly in index.html carry no such marker and are preserved.
 *
 * @param {string} html - Document that may contain prerendered Helmet tags.
 * @returns {string} Document with Helmet-managed tags removed.
 */
function stripHelmetTags(html) {
  return html
    .replace(/<script[^>]*\sdata-rh=["']true["'][^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<(meta|link)[^>]*\sdata-rh=["']true["'][^>]*\/?>/gi, '')
    .replace(/<title[^>]*\sdata-rh=["']true["'][^>]*>[\s\S]*?<\/title>/gi, '');
}

/**
 * @param {string} indexHtml - The built index.html.
 * @param {string} requestPath - Path being served.
 * @param {Object} [options] - `noindex` marks the response as not indexable,
 *   used for paths that resolve to no page so an error screen is never listed.
 */
export async function renderSeoHtml(indexHtml, requestPath, options = {}) {
  const path = normalizePath(requestPath);
  const [settings, config, faqs, blog, pseoPage, popularSearches] = await Promise.all([
    getSeoSettings(),
    PageSeo.findOne({ path }).lean(),
    path === '/'
      ? // General FAQs only. Subject FAQs belong to the tutor search page, and
        // including them here would describe the home page with answers it
        // does not show.
        FAQ.find({ isActive: true, subject: null })
          .select('question answer order createdAt')
          .sort({ order: 1, createdAt: -1 })
          .lean()
      : Promise.resolve([]),
    findPublishedBlogForPath(path),
    PseoPage.findOne({ path, isActive: true }).select('title description heading').lean(),
    path === '/'
      ? PopularSearch.find({ isActive: true }).select('label query order').sort({ order: 1 }).lean()
      : Promise.resolve([]),
  ]);

  // Precedence: an explicit SEO override wins, then the article's own fields,
  // then the site-wide defaults. Without the middle step every blog post would
  // share the homepage title and description.
  const title =
    config?.title ||
    (blog ? `${blog.title} | Best Choice Tutors` : null) ||
    pseoPage?.title ||
    DEFAULT_TITLE;
  const description =
    config?.description || blog?.excerpt || pseoPage?.description || DEFAULT_DESCRIPTION;
  const keywords = config?.keywords || DEFAULT_KEYWORDS;
  const canonicalUrl = config?.canonicalUrl || `${SITE_URL}${path}`;
  const ogDescription = config?.ogDescription || description;
  const ogTitle = config?.ogTitle || title;
  const ogType = config?.ogType || (blog ? 'article' : 'website');
  // Article images come from the post itself when the page has no override.
  const ogImage = config?.ogImage || blog?.imageUrl || DEFAULT_OG_IMAGE;
  const ogImageAlt = blog?.imageAlt || ogTitle;
  const ogUrl = `${SITE_URL}${path}`;

  // Drop Helmet's prerendered duplicates before injecting the canonical set.
  let html = stripHelmetTags(indexHtml);

  html = upsertTag(html, /<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = upsertTag(
    html,
    /<meta\s+name=["']description["'][^>]*>/i,
    `<meta name="description" content="${escapeHtml(description)}" />`,
  );
  html = upsertTag(
    html,
    /<meta\s+name=["']keywords["'][^>]*>/i,
    `<meta name="keywords" content="${escapeHtml(keywords)}" />`,
  );
  // Emitted for every page, not only hidden ones: a crawler that reads no
  // robots tag has to guess, and being explicit costs one line.
  const robotsValue = config?.noindex || options.noindex ? 'noindex, nofollow' : 'index, follow';
  html = upsertTag(
    html,
    /<meta\s+name=["']robots["'][^>]*>/i,
    `<meta name="robots" content="${robotsValue}" />`,
  );
  html = upsertTag(
    html,
    /<link\s+rel=["']canonical["'][^>]*>/i,
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
  );
  html = upsertTag(
    html,
    /<meta\s+property=["']og:title["'][^>]*>/i,
    `<meta property="og:title" content="${escapeHtml(ogTitle)}" />`,
  );
  html = upsertTag(
    html,
    /<meta\s+property=["']og:description["'][^>]*>/i,
    `<meta property="og:description" content="${escapeHtml(ogDescription)}" />`,
  );
  html = upsertTag(
    html,
    /<meta\s+property=["']og:type["'][^>]*>/i,
    `<meta property="og:type" content="${escapeHtml(ogType)}" />`,
  );
  html = upsertTag(
    html,
    /<meta\s+property=["']og:url["'][^>]*>/i,
    `<meta property="og:url" content="${escapeHtml(ogUrl)}" />`,
  );

  // Structured-data types an admin has switched off are skipped entirely.
  // A missing toggle defaults to on, so existing sites keep their schema.
  const toggles = settings?.schemaToggles ?? {};
  const schemaEnabled = (type) => toggles[type] !== false;

  // Breadcrumbs apply to every page except the homepage.
  const breadcrumbSchema = schemaEnabled('breadcrumb') ? buildBreadcrumbSchema(path, blog) : null;
  if (breadcrumbSchema) {
    const breadcrumbScript = `<script type="application/ld+json" data-seo="breadcrumb">${safeJson(breadcrumbSchema)}</script>`;
    html = upsertTag(
      html,
      /<script\s+type=["']application\/ld\+json["']\s+data-seo=["']breadcrumb["'][\s\S]*?<\/script>/i,
      breadcrumbScript,
    );
  }

  // Service schema describes the core offering and belongs on the homepage only.
  if (path === '/' && schemaEnabled('service')) {
    const serviceSchema = buildServiceSchema(popularSearches);
    const serviceScript = `<script type="application/ld+json" data-seo="service">${safeJson(serviceSchema)}</script>`;
    html = upsertTag(
      html,
      /<script\s+type=["']application\/ld\+json["']\s+data-seo=["']service["'][\s\S]*?<\/script>/i,
      serviceScript,
    );
  }

  const blogSchema = schemaEnabled('article') ? buildBlogPostingSchema(blog) : null;
  if (blogSchema) {
    const blogScript = `<script type="application/ld+json" data-seo="article">${safeJson(blogSchema)}</script>`;
    html = upsertTag(
      html,
      /<script\s+type=["']application\/ld\+json["']\s+data-seo=["']article["'][\s\S]*?<\/script>/i,
      blogScript,
    );
  }

  html = upsertTag(
    html,
    /<meta\s+property=["']og:image["'][^>]*>/i,
    `<meta property="og:image" content="${escapeHtml(ogImage)}" />`,
  );
  html = upsertTag(
    html,
    /<meta\s+property=["']og:image:alt["'][^>]*>/i,
    `<meta property="og:image:alt" content="${escapeHtml(ogImageAlt)}" />`,
  );
  html = upsertTag(
    html,
    /<meta\s+property=["']og:site_name["'][^>]*>/i,
    '<meta property="og:site_name" content="Best Choice Tutors" />',
  );

  // Twitter reads its own namespace and ignores most Open Graph tags, so the
  // card has to be declared separately or X shows a plain link.
  html = upsertTag(
    html,
    /<meta\s+name=["']twitter:card["'][^>]*>/i,
    '<meta name="twitter:card" content="summary_large_image" />',
  );
  html = upsertTag(
    html,
    /<meta\s+name=["']twitter:title["'][^>]*>/i,
    `<meta name="twitter:title" content="${escapeHtml(ogTitle)}" />`,
  );
  html = upsertTag(
    html,
    /<meta\s+name=["']twitter:description["'][^>]*>/i,
    `<meta name="twitter:description" content="${escapeHtml(ogDescription)}" />`,
  );
  html = upsertTag(
    html,
    /<meta\s+name=["']twitter:image["'][^>]*>/i,
    `<meta name="twitter:image" content="${escapeHtml(ogImage)}" />`,
  );

  // Search-engine ownership verification, editable from the admin panel so a
  // new property can be verified without a redeploy.
  const verificationTags = [
    ['google-site-verification', settings?.verification?.google],
    ['msvalidate.01', settings?.verification?.bing],
    ['p:domain_verify', settings?.verification?.pinterest],
    ['yandex-verification', settings?.verification?.yandex],
  ];
  for (const [metaName, token] of verificationTags) {
    if (!token) continue;
    html = upsertTag(
      html,
      new RegExp(`<meta\\s+name=["']${metaName}["'][^>]*>`, 'i'),
      `<meta name="${metaName}" content="${escapeHtml(token)}" />`,
    );
  }

  const faqSchema = schemaEnabled('faq') ? buildFAQSchema(faqs) : null;
  if (faqSchema) {
    const faqScript = `<script type="application/ld+json" data-seo="faq">${safeJson(faqSchema)}</script>`;
    html = upsertTag(
      html,
      /<script\s+type=["']application\/ld\+json["']\s+data-seo=["']faq["'][\s\S]*?<\/script>/i,
      faqScript,
    );
  }

  return html;
}
