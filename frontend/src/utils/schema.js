/**
 * JSON-LD Schema Generation Utilities
 * Pure functions that generate structured data objects for SEO.
 */

const SITE_URL = 'https://bestchoicetutors.com';
const ORGANIZATION_NAME = 'Best Choice Tutors';
const LOGO_URL = `${SITE_URL}/logo.png`;

/**
 * Generates Local Business (EducationalOrganization) schema.
 * @param {Object} [overrides] - Override default values
 * @returns {Object} JSON-LD schema object
 */
export function getLocalBusinessSchema(overrides = {}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    '@id': `${SITE_URL}/#organization`,
    name: ORGANIZATION_NAME,
    url: SITE_URL,
    logo: LOGO_URL,
    image: LOGO_URL,
    description:
      'Best Choice Tutors provides professional tutoring services, personalized learning programs, and academic support to help students achieve their educational goals.',
    telephone: '+44-XXX-XXX-XXXX',
    email: 'info@bestchoicetutors.com',
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Your Street Address',
      addressLocality: 'Your City',
      addressRegion: 'Your State',
      postalCode: 'Your ZIP Code',
      addressCountry: 'GB',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '00.000000',
      longitude: '00.000000',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '18:00',
      },
    ],
    sameAs: [
      'https://www.facebook.com/share/1FNTqVLKEd/?mibextid=wwXIfr',
      'https://www.instagram.com/best.choice.tutors',
      'https://www.linkedin.com/company/best-choice-tutors',
    ],
    areaServed: {
      '@type': 'Country',
      name: 'United Kingdom',
    },
    knowsAbout: [
      'Math Tutoring',
      'Science Tutoring',
      'English Tutoring',
      'GCSE Preparation',
      'A-Level Preparation',
      'SAT Preparation',
      'Online Tutoring',
      'Private Tutoring',
    ],
    ...overrides,
  };
}

/**
 * Generates FAQ schema from an array of Q&A items.
 * @param {Array<{question: string, answer: string}>} faqItems
 * @returns {Object} JSON-LD FAQPage schema
 */
export function getFAQSchema(faqItems = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

/**
 * Generates BreadcrumbList schema.
 * @param {Array<{name: string, path: string}>} crumbs - Breadcrumb items
 * @returns {Object} JSON-LD BreadcrumbList schema
 */
export function getBreadcrumbSchema(crumbs = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.path}`,
    })),
  };
}

/**
 * Generates Service schema for tutoring services.
 * @param {Object} [overrides] - Override default values
 * @returns {Object} JSON-LD Service schema
 */
export function getServiceSchema(overrides = {}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${SITE_URL}/#service`,
    name: 'Private Tutoring Services',
    description:
      'Best Choice Tutors provides personalized online and in-person tutoring services for students of all ages. Our experienced tutors help students improve academic performance across various subjects and standardized test preparation.',
    url: SITE_URL,
    provider: {
      '@type': 'EducationalOrganization',
      '@id': `${SITE_URL}/#organization`,
      name: ORGANIZATION_NAME,
      url: SITE_URL,
      logo: LOGO_URL,
    },
    serviceType: 'Tutoring Services',
    category: 'Education',
    areaServed: {
      '@type': 'Country',
      name: 'United Kingdom',
    },
    audience: {
      '@type': 'EducationalAudience',
      educationalRole: 'Student',
    },
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: SITE_URL,
      serviceLocation: {
        '@type': 'Place',
        name: ORGANIZATION_NAME,
      },
    },
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      priceCurrency: 'GBP',
      url: SITE_URL,
    },
    ...overrides,
  };
}

/**
 * Generates Article schema (reusable - NOT to be injected until blog is implemented).
 * @param {Object} article - Article data
 * @param {string} article.url - Article URL
 * @param {string} article.headline - Article headline
 * @param {string} article.description - Article description
 * @param {string} [article.imageUrl] - Featured image URL
 * @param {string} article.authorName - Author name
 * @param {string} article.datePublished - ISO date string
 * @param {string} [article.dateModified] - ISO date string
 * @returns {Object} JSON-LD Article schema
 */
export function getArticleSchema(article) {
  const now = new Date().toISOString();
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${article.url}#article`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url,
    },
    headline: article.headline,
    description: article.description,
    image: article.imageUrl ? [article.imageUrl] : [LOGO_URL],
    author: {
      '@type': 'Person',
      name: article.authorName,
    },
    publisher: {
      '@type': 'EducationalOrganization',
      name: ORGANIZATION_NAME,
      logo: {
        '@type': 'ImageObject',
        url: LOGO_URL,
      },
    },
    datePublished: article.datePublished || now,
    dateModified: article.dateModified || article.datePublished || now,
  };
}

/**
 * Combines multiple schema objects into a single array for batch injection.
 * Filters out null/undefined values.
 * @param  {...Object} schemas - Schema objects to combine
 * @returns {Array<Object>} Array of schema objects
 */
export function combineSchemas(...schemas) {
  return schemas.filter(Boolean);
}

