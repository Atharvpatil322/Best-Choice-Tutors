/**
 * BreadcrumbSchema Component
 * Dynamically generates and injects BreadcrumbList JSON-LD structured data
 * based on the current route pathname.
 * Works automatically for all existing and future pages.
 */

import { useLocation } from 'react-router-dom';
import { getBreadcrumbSchema } from '@/utils/schema';
import { getBreadcrumbs } from '@/utils/seo';
import StructuredData from './StructuredData';

export default function BreadcrumbSchema() {
  const { pathname } = useLocation();
  const crumbs = getBreadcrumbs(pathname);
  const schema = getBreadcrumbSchema(crumbs);
  return <StructuredData schema={schema} id="breadcrumb" />;
}

