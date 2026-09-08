import mongoose from 'mongoose';

const pageSeoSchema = new mongoose.Schema(
  {
    path: {
      type: String,
      required: [true, 'Path is required'],
      trim: true,
      lowercase: true,
      unique: true,
    },
    title: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    canonicalUrl: {
      type: String,
      default: '',
    },
    keywords: {
      type: String,
      default: '',
    },
    ogTitle: {
      type: String,
      default: '',
    },
    ogDescription: {
      type: String,
      default: '',
    },
    /**
     * Absolute URL of the image shown when the page is shared. Without one,
     * Facebook, LinkedIn, WhatsApp and Slack render a link with no preview.
     */
    ogImage: {
      type: String,
      default: '',
      trim: true,
    },
    ogType: {
      type: String,
      default: 'website',
    },
    /**
     * Keeps this page out of search results. Emitted as
     * <meta name="robots" content="noindex, nofollow">, which is how a page is
     * removed from an index - robots.txt only stops crawling, and a blocked
     * page can still be listed.
     */
    noindex: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'page_seo_configs',
  },
);

pageSeoSchema.index({ path: 1 }, { unique: true });

const PageSeo = mongoose.model('PageSeo', pageSeoSchema);
export default PageSeo;
