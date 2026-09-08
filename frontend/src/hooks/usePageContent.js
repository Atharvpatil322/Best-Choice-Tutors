import { useEffect, useState } from 'react';
import { getPublicPageContent } from '@/services/pageContentService';

/**
 * Load admin-edited copy for a public page.
 *
 * Returns an empty object until the request resolves, and on any failure, so
 * callers render the copy built into the component rather than a blank space.
 * That fallback is what keeps a page looking identical until someone edits it,
 * and keeps the page working if the API is unreachable.
 *
 * @param {string} pageKey - Registry key, e.g. 'home' or 'about'.
 * @returns {Object} Map of sectionKey to saved content.
 */
export function usePageContent(pageKey) {
  const [sections, setSections] = useState({});

  useEffect(() => {
    let cancelled = false;
    getPublicPageContent(pageKey).then((result) => {
      if (!cancelled) setSections(result || {});
    });
    return () => {
      cancelled = true;
    };
  }, [pageKey]);

  return sections;
}

/**
 * Pick an edited value, falling back to the component's built-in text.
 * Blank saved values fall through to the fallback, so clearing a field in the
 * admin panel restores the original copy rather than emptying the page.
 *
 * @param {Object} section - Saved section content, possibly undefined.
 * @param {string} field - Field name, e.g. 'heading'.
 * @param {string} fallback - The copy currently hardcoded in the component.
 * @returns {string}
 */
export function contentOr(section, field, fallback) {
  const value = section?.[field];
  return typeof value === 'string' && value.trim() ? value : fallback;
}

/**
 * Use edited items when the admin has supplied any, otherwise the built-in list.
 *
 * @param {Object} section - Saved section content, possibly undefined.
 * @param {Array} fallback - The list currently hardcoded in the component.
 * @returns {Array}
 */
export function itemsOr(section, fallback) {
  return Array.isArray(section?.items) && section.items.length > 0 ? section.items : fallback;
}
