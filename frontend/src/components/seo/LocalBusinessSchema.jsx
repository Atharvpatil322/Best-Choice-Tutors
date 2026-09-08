/**
 * LocalBusinessSchema Component
 * Injects EducationalOrganization JSON-LD structured data.
 * Used on the homepage and relevant pages.
 */

import { getLocalBusinessSchema } from '@/utils/schema';
import StructuredData from './StructuredData';

export default function LocalBusinessSchema({ overrides = {} }) {
  const schema = getLocalBusinessSchema(overrides);
  return <StructuredData schema={schema} id="local-business" />;
}

