/**
 * FAQSchema Component
 * Injects FAQPage JSON-LD structured data dynamically from FAQ data.
 * Uses the same data source as the FAQ UI section.
 */

import { getFAQSchema } from '@/utils/schema';
import { getFaqForSchema } from '@/utils/faqData';
import Seo from '../Seo';

export default function FAQSchema({ faqItems }) {
  const items = faqItems || getFaqForSchema();
  const schema = getFAQSchema(items);
  return <Seo structuredData={schema} />;
}

