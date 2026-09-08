import mongoose from 'mongoose';

/**
 * Page Content
 *
 * Editable copy for a single section of a public page, addressed by
 * `pageKey` + `sectionKey` (for example "home" + "hero").
 *
 * The schema is deliberately generic rather than one model per section: every
 * section needs some combination of a heading, body copy, a call to action, an
 * image, and an optional list of cards. Sections use the fields they need and
 * leave the rest empty, which keeps adding a new editable section to a registry
 * entry plus a component change, with no migration.
 *
 * Any section with no document here falls back to the copy currently hardcoded
 * in the component, so the site renders identically until an admin edits it.
 */

/** One card in a list-style section, such as an educational-level tile. */
const pageContentItemSchema = new mongoose.Schema(
  {
    title: { type: String, default: '', trim: true, maxlength: 200 },
    description: { type: String, default: '', trim: true, maxlength: 1000 },
    imageUrl: { type: String, default: '', trim: true },
    /** Alternative text, required for accessibility and image search. */
    imageAlt: { type: String, default: '', trim: true, maxlength: 250 },
    linkUrl: { type: String, default: '', trim: true },
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

const pageContentSchema = new mongoose.Schema(
  {
    /** Which public page this belongs to, e.g. 'home', 'about', 'how-it-works'. */
    pageKey: {
      type: String,
      required: [true, 'Page key is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    /** Which section within that page, e.g. 'hero', 'mission'. */
    sectionKey: {
      type: String,
      required: [true, 'Section key is required'],
      trim: true,
      lowercase: true,
    },

    heading: { type: String, default: '', trim: true, maxlength: 300 },
    subheading: { type: String, default: '', trim: true, maxlength: 500 },
    body: { type: String, default: '', trim: true, maxlength: 8000 },

    ctaLabel: { type: String, default: '', trim: true, maxlength: 120 },
    ctaHref: { type: String, default: '', trim: true, maxlength: 500 },

    imageUrl: { type: String, default: '', trim: true },
    imageAlt: { type: String, default: '', trim: true, maxlength: 250 },

    /** Card list for sections that render a grid. */
    items: {
      type: [pageContentItemSchema],
      default: [],
    },

    /**
     * When false the component falls back to its built-in copy, which gives a
     * way to revert an edit without deleting the record.
     */
    isActive: {
      type: Boolean,
      default: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true, collection: 'page_contents' }
);

// One document per section of a page.
pageContentSchema.index({ pageKey: 1, sectionKey: 1 }, { unique: true });

const PageContent = mongoose.model('PageContent', pageContentSchema);

export default PageContent;
