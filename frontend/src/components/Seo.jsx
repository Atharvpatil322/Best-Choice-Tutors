import { useEffect } from 'react';

const DEFAULT_TITLE = 'Best Choice Tutors - Expert Tutors. Real Results. Real Futures.';
const DEFAULT_DESCRIPTION =
  'Find expert online and in‑person tutors for GCSE, A‑Levels, university, languages and more. Safe payments, verified tutors, and flexible scheduling.';
const DEFAULT_KEYWORDS =
  'online tutors, GCSE tutors, A-Level tutors, university tutoring, language tutors, maths tutor, physics tutor, English tutor';

function setMetaTag(selector, attributes) {
  if (typeof document === 'undefined') return;
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement('meta');
    Object.entries(attributes).forEach(([key, value]) => {
      if (value != null) tag.setAttribute(key, value);
    });
    document.head.appendChild(tag);
  } else if (attributes.content != null) {
    tag.setAttribute('content', attributes.content);
  }
}

function setStructuredData(structuredData) {
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector('script[type="application/ld+json"][data-seo="schema-org"]');
  const json = structuredData ? JSON.stringify(structuredData) : '';

  if (!json) {
    if (existing) {
      existing.remove();
    }
    return;
  }

  if (existing) {
    existing.textContent = json;
    return;
  }

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-seo', 'schema-org');
  script.textContent = json;
  document.head.appendChild(script);
}

export function Seo({
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  ogImage,
  ogUrl,
  ogType = 'website',
  structuredData,
}) {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const finalTitle = title || DEFAULT_TITLE;
    const finalDescription = description || DEFAULT_DESCRIPTION;
    const finalKeywords = keywords || DEFAULT_KEYWORDS;

    document.title = finalTitle;

    // Primary meta tags
    setMetaTag('meta[name="description"]', {
      name: 'description',
      content: finalDescription,
    });
    setMetaTag('meta[name="keywords"]', {
      name: 'keywords',
      content: finalKeywords,
    });

    // Open Graph tags
    setMetaTag('meta[property="og:title"]', {
      property: 'og:title',
      content: ogTitle || finalTitle,
    });
    setMetaTag('meta[property="og:description"]', {
      property: 'og:description',
      content: ogDescription || finalDescription,
    });
    if (ogImage) {
      setMetaTag('meta[property="og:image"]', {
        property: 'og:image',
        content: ogImage,
      });
    }
    if (ogUrl && typeof window !== 'undefined') {
      setMetaTag('meta[property="og:url"]', {
        property: 'og:url',
        content: ogUrl,
      });
    } else if (typeof window !== 'undefined') {
      setMetaTag('meta[property="og:url"]', {
        property: 'og:url',
        content: window.location.href,
      });
    }
    setMetaTag('meta[property="og:type"]', {
      property: 'og:type',
      content: ogType,
    });

    // Optional structured data (JSON-LD)
    setStructuredData(structuredData);
  }, [
    title,
    description,
    keywords,
    ogTitle,
    ogDescription,
    ogImage,
    ogUrl,
    ogType,
    structuredData,
  ]);

  return null;
}

export default Seo;

