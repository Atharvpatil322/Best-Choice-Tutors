/**
 * SEO Utility Functions
 * Reusable helpers for canonical URLs, meta generation, and SEO-related operations.
 */

const SITE_URL = 'https://bestchoicetutors.com';

/**
 * Generates the full canonical URL for a given path.
 * @param {string} path - The route path (e.g., '/about', '/how-it-works')
 * @returns {string} Full canonical URL
 */
export function getCanonicalUrl(path = '') {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${cleanPath}`;
}

/**
 * Generates the current page's canonical URL using window.location.
 * Falls back to provided path if window is undefined (SSR).
 * @param {string} [fallbackPath] - Fallback path if window is unavailable
 * @returns {string} Full canonical URL
 */
export function getCurrentCanonicalUrl(fallbackPath = '/') {
  if (typeof window !== 'undefined') {
    return `${SITE_URL}${window.location.pathname}`;
  }
  return getCanonicalUrl(fallbackPath);
}

/**
 * Default meta tags used across the site.
 */
export const DEFAULT_SEO = {
  title: 'Best Choice Tutors - Expert Tutors. Real Results.',
  description:
    'Find expert online and in‑person tutors for GCSE, A‑Levels, university, languages and more. Safe payments, verified tutors, and flexible scheduling.',
  keywords:
    'online tutors, GCSE tutors, A-Level tutors, university tutoring, language tutors, maths tutor, physics tutor, English tutor',
};

/**
 * Page-specific SEO configs for easy maintenance.
 * Add new pages here as they are created.
 */
export const PAGE_SEO = {
  '/': {
    title: 'Best Choice Tutors | Find Expert Tutors Online',
    description:
      'Find expert tutors online and in-person for Mathematics, Physics, English, Languages, GCSE, A-Levels and university. Compare vetted tutors and book securely.',
    keywords:
      'find expert tutors online, maths tutor online, physics tutor online, English tutor, language tutor, GCSE tutoring, A-Level tutoring, online tuition platform',
    ogTitle: 'Find Expert Tutors Online | Best Choice Tutors',
    ogDescription:
      'Connect with expert tutors for Mathematics, Physics, English and Languages. Learn online or in-person with a trusted UK tutoring platform.',
  },
  '/about': {
    title: 'About Us | Best Choice Tutors',
    description:
      'Learn about Best Choice Tutors - a trusted tutoring marketplace connecting learners with verified tutors for GCSE, A-Levels, 11+, SATs, and university pathways.',
    ogTitle: 'About Best Choice Tutors',
    ogDescription:
      'A trusted tutoring marketplace connecting learners with verified tutors across multiple subjects and educational levels.',
  },
  '/how-it-works': {
    title: 'How It Works | Best Choice Tutors',
    description:
      'Discover how Best Choice Tutors works. Search for tutors, compare profiles, book securely, and start learning with expert guidance.',
    ogTitle: 'How Best Choice Tutors Works',
    ogDescription:
      'Simple steps to find, compare and book expert tutors. Start your learning journey today.',
  },
  '/contact': {
    title: 'Contact Us | Best Choice Tutors',
    description:
      'Get in touch with Best Choice Tutors. Email our support team for help with bookings, tutor matching, or any questions about our tutoring platform.',
    ogTitle: 'Contact Best Choice Tutors',
    ogDescription: 'Reach out to our support team for assistance with bookings and inquiries.',
  },
  '/terms': {
    title: 'Terms and Conditions | Best Choice Tutors',
    description:
      'Read the Terms and Conditions for using Best Choice Tutors. Understand your rights and obligations as a learner or tutor on our platform.',
    ogTitle: 'Terms and Conditions | Best Choice Tutors',
  },
  '/privacy': {
    title: 'Privacy Policy | Best Choice Tutors',
    description:
      'Review the Privacy Policy for Best Choice Tutors. Learn how we collect, use, and protect your personal data when using our tutoring platform.',
    ogTitle: 'Privacy Policy | Best Choice Tutors',
  },
};

/**
 * Breadcrumb definitions for key pages.
 * @param {string} pathname - Current route path
 * @returns {Array<{name: string, path: string}>} Breadcrumb items
 */
export function getBreadcrumbs(pathname) {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs = [{ name: 'Home', path: '/' }];

  let currentPath = '';
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const name = segment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
    crumbs.push({ name, path: currentPath });
  }

  return crumbs;
}

