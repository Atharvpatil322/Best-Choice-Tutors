/**
 * Structured Data
 *
 * Emits a single JSON-LD block and nothing else.
 *
 * Schema components used to render the full <Seo> component instead. Because
 * <Seo> falls back to the site-wide defaults when given no title, every schema
 * on a page also emitted a default title, description and canonical - and
 * Helmet applies the last one it sees, so a page's real title was overwritten
 * by whichever schema happened to render after it. Keeping structured data
 * separate from page metadata is what stops that.
 */

import { Helmet } from 'react-helmet-async';

/**
 * @param {Object|null} schema - JSON-LD object; nothing renders when absent.
 * @param {string} [id] - Value for data-seo, useful when inspecting the DOM.
 */
export default function StructuredData({ schema, id = 'schema-org' }) {
  if (!schema) return null;
  return (
    <Helmet>
      <script type="application/ld+json" data-seo={id}>
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
}
