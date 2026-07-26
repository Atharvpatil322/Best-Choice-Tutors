/**
 * LocalBusinessSchema Component
 * Injects EducationalOrganization JSON-LD structured data.
 * Used on the homepage and relevant pages.
 */

import { getLocalBusinessSchema } from '@/utils/schema';
import Seo from '../Seo';

export default function LocalBusinessSchema({ overrides = {} }) {
  const schema = getLocalBusinessSchema(overrides);
  return <Seo structuredData={schema} />;
}

