import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://bestchoicetutors.com';
const DEFAULT_TITLE = 'Best Choice Tutors - Expert Tutors. Real Results.';
const DEFAULT_DESCRIPTION =
  'Find expert tutors online and in‑person for GCSE, A‑Levels, university, languages and more. Safe payments, verified tutors, and flexible scheduling.';
const DEFAULT_KEYWORDS =
  'online tutors, GCSE tutors, A-Level tutors, university tutoring, language tutors, maths tutor, physics tutor, English tutor';
const SEO_API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');
const SEO_API_PATH = SEO_API_BASE.endsWith('/api')
  ? `${SEO_API_BASE}/public/seo`
  : `${SEO_API_BASE}/api/public/seo`;

function resolvePath(path) {
  if (!path || typeof path !== 'string') return '/';
  let normalized = path.trim();
  if (!normalized) return '/';
  if (!normalized.startsWith('/')) normalized = `/${normalized}`;
  if (normalized.length > 1) {
    normalized = normalized.replace(/\/+/g, '/').replace(/\/$/, '');
  }
  return normalized;
}

async function fetchSeoConfig(path) {
  if (typeof window === 'undefined') return null;
  try {
    const response = await fetch(`${SEO_API_PATH}?path=${encodeURIComponent(path)}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data?.config || null;
  } catch (err) {
    return null;
  }
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
  canonicalUrl,
  path,
}) {
  const resolvedPath = resolvePath(path ?? (typeof window !== 'undefined' ? window.location.pathname : '/'));
  const [overrideConfig, setOverrideConfig] = useState(null);

  useEffect(() => {
    let canceled = false;

    if (typeof window === 'undefined') return undefined;
    const load = async () => {
      const config = await fetchSeoConfig(resolvedPath);
      if (!canceled && config) {
        setOverrideConfig(config);
      }
    };

    load();

    return () => {
      canceled = true;
    };
  }, [resolvedPath]);

  const effectiveConfig = useMemo(() => overrideConfig || {}, [overrideConfig]);
  const finalTitle = effectiveConfig.title || title || DEFAULT_TITLE;
  const finalDescription = effectiveConfig.description || description || DEFAULT_DESCRIPTION;
  const finalKeywords = effectiveConfig.keywords || keywords || DEFAULT_KEYWORDS;
  const finalUrl = ogUrl || effectiveConfig.ogUrl || `${SITE_URL}${resolvedPath}`;
  const finalCanonical = canonicalUrl || effectiveConfig.canonicalUrl || `${SITE_URL}${resolvedPath}`;
  const finalOgTitle = effectiveConfig.ogTitle || ogTitle || finalTitle;
  const finalOgDescription = effectiveConfig.ogDescription || ogDescription || finalDescription;
  const finalOgImage = effectiveConfig.ogImage || ogImage;
  const finalOgType = effectiveConfig.ogType || ogType;

  return (
    <Helmet>
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />

      <meta property="og:title" content={finalOgTitle} />
      <meta property="og:description" content={finalOgDescription} />
      {finalOgImage ? <meta property="og:image" content={finalOgImage} /> : null}
      <meta property="og:url" content={finalUrl} />
      <meta property="og:type" content={finalOgType} />

      <link rel="canonical" href={finalCanonical} />

      {structuredData ? (
        <script type="application/ld+json" data-seo="schema-org">
          {JSON.stringify(structuredData)}
        </script>
      ) : null}
    </Helmet>
  );
}

export default Seo;
