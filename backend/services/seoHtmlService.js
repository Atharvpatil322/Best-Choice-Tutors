import FAQ from '../models/FAQ.js';
import PageSeo from '../models/PageSeo.js';

const SITE_URL = 'https://bestchoicetutors.com';
const DEFAULT_TITLE = 'Best Choice Tutors - Expert Tutors. Real Results.';
const DEFAULT_DESCRIPTION =
  'Find expert tutors online and in-person for GCSE, A-Levels, university, languages and more. Safe payments, verified tutors, and flexible scheduling.';
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

function upsertTag(html, tagRegex, tagMarkup) {
  if (tagRegex.test(html)) {
    return html.replace(tagRegex, tagMarkup);
  }
  return html.replace('</head>', `    ${tagMarkup}\n  </head>`);
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

export async function renderSeoHtml(indexHtml, requestPath) {
  const path = normalizePath(requestPath);
  const [config, faqs] = await Promise.all([
    PageSeo.findOne({ path }).lean(),
    path === '/'
      ? FAQ.find({ isActive: true })
          .select('question answer order createdAt')
          .sort({ order: 1, createdAt: -1 })
          .lean()
      : Promise.resolve([]),
  ]);

  const title = config?.title || DEFAULT_TITLE;
  const description = config?.description || DEFAULT_DESCRIPTION;
  const keywords = config?.keywords || DEFAULT_KEYWORDS;
  const canonicalUrl = config?.canonicalUrl || `${SITE_URL}${path}`;
  const ogDescription = config?.ogDescription || description;
  const ogTitle = config?.ogTitle || title;
  const ogType = config?.ogType || 'website';
  const ogUrl = `${SITE_URL}${path}`;

  let html = indexHtml;

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

  const faqSchema = buildFAQSchema(faqs);
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
