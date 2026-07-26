/**
 * ServiceSchema Component
 * Injects Service JSON-LD structured data describing tutoring services.
 * Used on the homepage to describe the primary service offering.
 */

import { getServiceSchema } from '@/utils/schema';
import Seo from '../Seo';

export default function ServiceSchema({ overrides = {} }) {
  const schema = getServiceSchema(overrides);
  return <Seo structuredData={schema} />;
}

