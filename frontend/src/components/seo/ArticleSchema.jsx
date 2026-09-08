/**
 * ArticleSchema Component
 * Reusable Article JSON-LD structured data component.
 *
 * IMPORTANT: Do NOT inject this component anywhere until the blog section is implemented.
 * This is provided as a reusable utility for future use only.
 *
 * @param {Object} props
 * @param {string} props.url - Article full URL
 * @param {string} props.headline - Article headline
 * @param {string} props.description - Article description
 * @param {string} [props.imageUrl] - Featured image URL
 * @param {string} props.authorName - Author name
 * @param {string} props.datePublished - ISO date string
 * @param {string} [props.dateModified] - ISO date string
 */

import { getArticleSchema } from '@/utils/schema';
import StructuredData from './StructuredData';

export default function ArticleSchema({
  url,
  headline,
  description,
  imageUrl,
  authorName,
  datePublished,
  dateModified,
}) {
  const schema = getArticleSchema({
    url,
    headline,
    description,
    imageUrl,
    authorName,
    datePublished,
    dateModified,
  });
  return <StructuredData schema={schema} id="article" />;
}

