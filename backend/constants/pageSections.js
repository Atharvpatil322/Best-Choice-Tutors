/**
 * Page section registry
 *
 * Declares which public pages are editable, which sections each contains, and
 * which fields are meaningful for each section. The admin panel builds its
 * forms from this registry, so adding a newly editable section means adding an
 * entry here and reading the content in the matching component — no schema
 * change and no migration.
 *
 * `fields` controls which inputs the admin form renders, and `itemFields`
 * controls which inputs each list item shows - a subject tile needs an image,
 * a bullet needs only a title. `defaults` records the
 * copy currently hardcoded in the component; it is shown as placeholder text so
 * an editor can see what they are overriding, and is never written to the
 * database. A section left unedited continues to render the component's own
 * copy, which is why the site looks unchanged until someone edits it.
 */

export const PAGE_SECTIONS = [
  {
    pageKey: 'home',
    label: 'Home',
    description: 'The landing page shown to logged-out visitors.',
    sections: [
      {
        sectionKey: 'hero',
        label: 'Hero',
        // No call to action: the hero contains a search box, not a button.
        fields: ['heading', 'subheading'],
        defaults: { heading: 'Expert Tutors. Real Results.' },
      },
      {
        sectionKey: 'welcome',
        label: 'Get started steps',
        fields: ['heading', 'items'],
        itemFields: ['title', 'description'],
        defaults: { heading: 'Get Started in 3 Simple Steps' },
      },
      {
        sectionKey: 'reach',
        label: 'Global reach',
        fields: ['heading', 'subheading', 'body', 'ctaLabel', 'ctaHref', 'items'],
        itemFields: ['title'],
        defaults: { heading: 'Global Reach, Local Expertise' },
        itemHint: 'Each item is one bullet under the image.',
      },
      {
        sectionKey: 'book',
        label: 'Booking call to action',
        fields: ['heading', 'subheading', 'items'],
        itemFields: ['title', 'linkUrl'],
        defaults: { heading: 'Start your journey with Best Choice Tutors' },
        itemHint: 'Each item is a button: title is the label, link URL is where it goes.',
      },
    ],
  },
  {
    pageKey: 'about',
    label: 'About Us',
    description: 'The /about page.',
    sections: [
      {
        sectionKey: 'hero',
        label: 'Page intro',
        fields: ['heading', 'subheading'],
        defaults: { heading: 'About Best Choice Tutors' },
      },
      {
        sectionKey: 'mission',
        label: 'Our mission',
        fields: ['heading', 'body'],
        defaults: { heading: 'Our Mission' },
      },
      {
        sectionKey: 'values',
        label: 'Why learners choose us',
        fields: ['heading', 'items'],
        itemFields: ['title'],
        defaults: { heading: 'Why learners choose us' },
        itemHint: 'Each item is one bullet point.',
      },
      {
        sectionKey: 'cta',
        label: 'Closing call to action',
        fields: ['heading', 'subheading', 'items'],
        itemFields: ['title', 'linkUrl'],
        defaults: { heading: 'Get started today' },
        itemHint: 'Each item is a button: title is the label, link URL is where it goes.',
      },
    ],
  },
  {
    pageKey: 'how-it-works',
    label: 'How It Works',
    description: 'The /how-it-works page.',
    sections: [
      {
        sectionKey: 'intro',
        label: 'Page intro',
        fields: ['heading', 'subheading'],
        defaults: { heading: 'How it works' },
      },
      {
        sectionKey: 'steps',
        label: 'Learner steps',
        fields: ['heading', 'items'],
        itemFields: ['title', 'description'],
        defaults: { heading: 'For learners' },
        itemHint: 'Steps shown under the "For learners" tab.',
      },
      {
        sectionKey: 'tutor-steps',
        label: 'Tutor steps',
        fields: ['heading', 'items'],
        itemFields: ['title', 'description'],
        defaults: { heading: 'For tutors' },
        itemHint: 'Steps shown under the "For tutors" tab.',
      },
    ],
  },
  {
    pageKey: 'subjects',
    label: 'Subjects',
    description:
      'Subject tiles and copy. Rendered within the home page; there is no standalone subjects page yet.',
    sections: [
      {
        sectionKey: 'tiles',
        label: 'Subject tiles',
        fields: ['heading', 'items'],
        itemFields: ['title', 'imageUrl', 'imageAlt'],
        defaults: {},
        itemHint: 'Each tile: title, image URL and alt text.',
      },
    ],
  },
];

/**
 * Look up a page definition.
 *
 * @param {string} pageKey
 * @returns {Object|undefined}
 */
export function getPageDefinition(pageKey) {
  return PAGE_SECTIONS.find((page) => page.pageKey === pageKey);
}

/**
 * Check whether a page/section pair is declared in the registry. Guards the
 * admin endpoints against writing content for sections nothing renders.
 *
 * @param {string} pageKey
 * @param {string} sectionKey
 * @returns {boolean}
 */
export function isKnownSection(pageKey, sectionKey) {
  const page = getPageDefinition(pageKey);
  if (!page) return false;
  return page.sections.some((section) => section.sectionKey === sectionKey);
}
