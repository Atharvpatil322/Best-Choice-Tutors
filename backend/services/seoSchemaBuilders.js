/**
 * Structured data builders
 *
 * Pure functions that turn database records into schema.org JSON-LD. They
 * touch no database and no request, so the same output is produced for the
 * build-time page generator, the Express renderer and the admin preview, and
 * every one of them can be unit tested.
 *
 * Every builder leaves a property out rather than emitting an empty or
 * placeholder value: Google treats "Your City" or "+44-XXX" as real data, and
 * a missing optional field is never an error.
 */

/** Public site origin. Overridable so staging advertises its own hostname. */
export const SITE_URL = (process.env.SITE_URL || 'https://bestchoicetutors.com').replace(/\/+$/, '');

/** Stable identifiers so every page can point at the same entities. */
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export const BRAND_NAME = 'Best Choice Tutors';
const DEFAULT_LOGO = `${SITE_URL}/logo.png`;
const DEFAULT_ORGANIZATION_DESCRIPTION =
  'Best Choice Tutors connects learners with verified tutors for GCSE, A-Levels, university and languages, online and in person, with secure payments.';

/** Organization types the admin may choose. OnlineBusiness suits an online-only service. */
export const ORGANIZATION_TYPES = ['EducationalOrganization', 'Organization', 'OnlineBusiness', 'LocalBusiness'];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** Google's limit for an article headline before it is truncated. */
const HEADLINE_MAX = 110;

/**
 * Trimmed string, or undefined when blank, so JSON.stringify drops the key.
 *
 * @param {unknown} value
 * @returns {string|undefined}
 */
function text(value) {
  if (value === null || value === undefined) return undefined;
  const trimmed = String(value).trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Non-empty trimmed strings from a list, or undefined when none remain.
 *
 * @param {unknown} values
 * @returns {string[]|undefined}
 */
function textList(values) {
  if (!Array.isArray(values)) return undefined;
  const list = values.map(text).filter(Boolean);
  return list.length ? list : undefined;
}

/**
 * Make a site-relative URL absolute; leave absolute URLs alone.
 *
 * @param {string|undefined} value
 * @returns {string|undefined}
 */
export function absoluteUrl(value) {
  const url = text(value);
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

/**
 * Remove keys whose value is undefined, an empty object or an empty array,
 * recursively, so optional sections disappear instead of shipping as {}.
 *
 * @param {Object} value
 * @returns {Object}
 */
function compact(value) {
  if (Array.isArray(value)) {
    const list = value.map((item) => (item && typeof item === 'object' ? compact(item) : item)).filter(
      (item) => item !== undefined && !(typeof item === 'object' && item !== null && Object.keys(item).length === 0),
    );
    return list;
  }
  const result = {};
  for (const [key, raw] of Object.entries(value)) {
    if (raw === undefined || raw === null) continue;
    const item = typeof raw === 'object' ? compact(raw) : raw;
    if (typeof item === 'object' && !Array.isArray(item) && Object.keys(item).length === 0) continue;
    if (Array.isArray(item) && item.length === 0) continue;
    result[key] = item;
  }
  return result;
}

/** Whether an object holds anything besides its @type. */
function hasContent(value) {
  return Object.keys(value).some((key) => key !== '@type');
}

/**
 * Organization (or a subtype) describing the business. Placed on the homepage;
 * every other entity points at it through ORGANIZATION_ID.
 *
 * @param {Object} [org] - SeoSetting.organization.
 * @returns {Object} JSON-LD object.
 */
export function buildOrganizationSchema(org = {}) {
  const type = ORGANIZATION_TYPES.includes(org.type) ? org.type : 'EducationalOrganization';
  const onlineOnly = Boolean(org.onlineOnly);

  const address = onlineOnly
    ? undefined
    : compact({
        '@type': 'PostalAddress',
        streetAddress: text(org.address?.streetAddress),
        addressLocality: text(org.address?.addressLocality),
        addressRegion: text(org.address?.addressRegion),
        postalCode: text(org.address?.postalCode),
        addressCountry: text(org.address?.addressCountry),
      });

  const latitude = Number.parseFloat(org.geo?.latitude);
  const longitude = Number.parseFloat(org.geo?.longitude);
  const hasGeo =
    !onlineOnly &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    !(latitude === 0 && longitude === 0);

  const openingHours = onlineOnly
    ? undefined
    : (org.openingHours || [])
        .map((slot) => {
          const days = (slot?.days || []).filter((day) => DAYS.includes(day));
          if (!days.length || !text(slot?.opens) || !text(slot?.closes)) return undefined;
          return { '@type': 'OpeningHoursSpecification', dayOfWeek: days, opens: slot.opens, closes: slot.closes };
        })
        .filter(Boolean);

  const contactPoints = (org.contactPoints || [])
    .map((point) => {
      const entry = compact({
        '@type': 'ContactPoint',
        contactType: text(point?.contactType),
        telephone: text(point?.telephone),
        email: text(point?.email),
        areaServed: text(point?.areaServed),
        availableLanguage: textList(point?.availableLanguage),
      });
      // A contact point is only useful with a way to get in touch.
      return entry.telephone || entry.email ? entry : undefined;
    })
    .filter(Boolean);

  const founders = textList(org.founders)?.map((name) => ({ '@type': 'Person', name }));
  const areaServed = textList(org.areaServed)?.map((name) => ({ '@type': 'Country', name }));

  const companyNumber = text(org.companyNumber);

  return compact({
    '@context': 'https://schema.org',
    '@type': type,
    '@id': ORGANIZATION_ID,
    name: text(org.name) || BRAND_NAME,
    legalName: text(org.legalName),
    alternateName: text(org.alternateName),
    slogan: text(org.slogan),
    description: text(org.description) || DEFAULT_ORGANIZATION_DESCRIPTION,
    url: absoluteUrl(org.url) || SITE_URL,
    logo: absoluteUrl(org.logo) || DEFAULT_LOGO,
    image: absoluteUrl(org.image),
    email: text(org.email),
    telephone: text(org.telephone),
    contactPoint: contactPoints.length ? contactPoints : undefined,
    address: address && hasContent(address) ? address : undefined,
    geo: hasGeo ? { '@type': 'GeoCoordinates', latitude, longitude } : undefined,
    openingHoursSpecification: openingHours?.length ? openingHours : undefined,
    priceRange: text(org.priceRange),
    sameAs: textList(org.sameAs)?.map(absoluteUrl),
    foundingDate: text(org.foundingDate),
    founder: founders,
    areaServed,
    knowsAbout: textList(org.knowsAbout),
    vatID: text(org.vatID),
    taxID: text(org.taxID),
    identifier: companyNumber
      ? { '@type': 'PropertyValue', propertyID: 'Company registration number', value: companyNumber }
      : undefined,
  });
}

/**
 * WebSite entity, so search engines connect the site name to the domain.
 *
 * @param {Object} [org] - SeoSetting.organization (websiteName lives there).
 * @returns {Object} JSON-LD object.
 */
export function buildWebSiteSchema(org = {}) {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: text(org.websiteName) || text(org.name) || BRAND_NAME,
    alternateName: text(org.websiteAlternateName),
    url: `${SITE_URL}/`,
    inLanguage: 'en-GB',
    publisher: { '@id': ORGANIZATION_ID },
  });
}

/**
 * BreadcrumbList from an explicit trail of { name, path } items.
 *
 * @param {Array<{ name: string, path: string }>} trail - Home first.
 * @returns {Object|null} JSON-LD object, or null for a single-item trail.
 */
export function buildBreadcrumbSchema(trail) {
  const items = (trail || []).filter((item) => text(item?.name) && text(item?.path));
  if (items.length < 2) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path === '/' ? '/' : item.path}`,
    })),
  };
}

/**
 * Service describing the tutoring offering, with the subjects the site
 * currently promotes as its catalogue.
 *
 * @param {string[]} subjects - Subject names to list.
 * @returns {Object} JSON-LD object.
 */
export function buildServiceSchema(subjects = []) {
  const names = textList(subjects) || [];
  return compact({
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${SITE_URL}/#service`,
    serviceType: 'Tutoring',
    name: 'Private tutoring',
    description:
      'One-to-one online and in-person tutoring with verified, DBS-checked tutors for GCSE, A-Levels, university and language subjects.',
    provider: { '@id': ORGANIZATION_ID },
    areaServed: { '@type': 'Country', name: 'United Kingdom' },
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: `${SITE_URL}/tutors`,
      availableLanguage: { '@type': 'Language', name: 'English' },
    },
    hasOfferCatalog: names.length
      ? {
          '@type': 'OfferCatalog',
          name: 'Tutoring subjects',
          itemListElement: names.map((name) => ({
            '@type': 'Offer',
            itemOffered: { '@type': 'Service', name: `${name} tutoring` },
          })),
        }
      : undefined,
  });
}

/**
 * Whether a blog author is the business itself rather than a named person.
 *
 * @param {string} author
 * @param {string} organizationName
 * @returns {boolean}
 */
function isBrandAuthor(author, organizationName) {
  const value = text(author);
  if (!value) return true;
  const normalise = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  return normalise(value) === normalise(BRAND_NAME) || normalise(value) === normalise(organizationName || '');
}

/**
 * Valid ISO date string, or undefined. Never invents "now": a missing date is
 * better than a wrong one.
 *
 * @param {Date|string|undefined} value
 * @returns {string|undefined}
 */
function isoDate(value) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/**
 * BlogPosting for an article page, meeting Google's Article guidance: a
 * headline within 110 characters, real publish and modify dates, an image,
 * and an author that is either the organisation or a named person.
 *
 * @param {Object} blog - Published blog record.
 * @param {Object} [org] - SeoSetting.organization, to name the brand author.
 * @returns {Object|null} JSON-LD object.
 */
export function buildBlogPostingSchema(blog, org = {}) {
  if (!blog || !text(blog.slug) || !text(blog.title)) return null;
  const url = `${SITE_URL}/blog/${blog.slug}`;
  const title = text(blog.title);
  const headline = title.length > HEADLINE_MAX ? `${title.slice(0, HEADLINE_MAX - 1).trimEnd()}…` : title;
  const image = absoluteUrl(blog.imageUrl);

  const author = isBrandAuthor(blog.author, org.name)
    ? { '@type': 'Organization', '@id': ORGANIZATION_ID, name: text(org.name) || BRAND_NAME, url: `${SITE_URL}/` }
    : compact({ '@type': 'Person', name: text(blog.author), url: absoluteUrl(blog.authorUrl) });

  const published = isoDate(blog.publishedAt) || isoDate(blog.createdAt);
  const modified = isoDate(blog.updatedAt) || published;

  return compact({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    headline,
    description: text(blog.excerpt),
    image: image ? [{ '@type': 'ImageObject', url: image, caption: text(blog.imageAlt) }] : undefined,
    datePublished: published,
    dateModified: modified,
    author,
    publisher: { '@id': ORGANIZATION_ID },
    isPartOf: { '@id': WEBSITE_ID },
    inLanguage: 'en-GB',
    articleSection: text(blog.category),
  });
}

/**
 * FAQPage from question and answer pairs shown on the page.
 *
 * @param {Array<{ question: string, answer: string }>} faqs
 * @returns {Object|null} JSON-LD object, or null when there are none.
 */
export function buildFaqSchema(faqs) {
  const items = (faqs || []).filter((faq) => text(faq?.question) && text(faq?.answer));
  if (!items.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((faq) => ({
      '@type': 'Question',
      name: text(faq.question),
      acceptedAnswer: { '@type': 'Answer', text: text(faq.answer) },
    })),
  };
}

/**
 * Recommended Organization fields that are still empty, for the admin panel's
 * completeness hints.
 *
 * @param {Object} [org]
 * @returns {string[]} Human-readable field names.
 */
export function missingOrganizationFields(org = {}) {
  const missing = [];
  if (!text(org.logo)) missing.push('Logo (the default logo is used)');
  if (!text(org.email) && !text(org.telephone)) missing.push('Email or telephone');
  if (!textList(org.sameAs)) missing.push('Social profiles');
  if (!org.onlineOnly && !text(org.address?.addressLocality)) missing.push('Address, or tick "online only"');
  if (org.type === 'LocalBusiness' && !text(org.address?.streetAddress)) {
    missing.push('Street address (required for LocalBusiness)');
  }
  return missing;
}
