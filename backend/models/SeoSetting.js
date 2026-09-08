import mongoose from 'mongoose';

/**
 * SEO Setting
 *
 * Single-document collection holding site-wide SEO configuration that the SEO
 * team edits from the admin panel: crawl rules, sitemap tuning, the llms.txt
 * preamble, search-engine verification tags, and which structured-data types
 * are emitted.
 *
 * Stored in the database rather than in files so changes take effect without a
 * redeploy. Always read through `getSeoSettings()` in seoContentService, which
 * creates the document on first use.
 */

const seoSettingSchema = new mongoose.Schema(
  {
    /** Discriminator guaranteeing only one settings document can exist. */
    singleton: {
      type: String,
      default: 'global',
      unique: true,
      immutable: true,
    },

    // ---------------------------------------------------------------- robots
    /**
     * 'auto'  - allow crawling in production, block everything elsewhere
     * 'allow' - always serve the production allow-list
     * 'block' - always disallow everything (useful while a site is in preview)
     */
    robotsMode: {
      type: String,
      enum: ['auto', 'allow', 'block'],
      default: 'auto',
    },
    /**
     * Complete replacement for robots.txt, served verbatim when set. Blank
     * means the generated rules below are used instead. One field rather than
     * several toggles, so what an admin types is exactly what crawlers read.
     */
    robotsOverride: {
      type: String,
      default: '',
      maxlength: [8000, 'robots.txt cannot exceed 8000 characters'],
    },

    // --------------------------------------------------------------- sitemap
    /** Paths excluded from sitemap.xml even if otherwise eligible. */
    sitemapExcludePaths: {
      type: [String],
      default: [],
    },
    /** Whether published blog posts are listed in the sitemap. */
    sitemapIncludeBlogs: {
      type: Boolean,
      default: true,
    },
    /** Whether generated programmatic landing pages are listed. */
    sitemapIncludePseo: {
      type: Boolean,
      default: true,
    },

    // ------------------------------------------------------------- llms.txt
    /** Opening summary paragraph for llms.txt. Blank falls back to the default. */
    llmsIntro: {
      type: String,
      default: '',
      maxlength: [4000, 'llms.txt intro cannot exceed 4000 characters'],
    },

    // ---------------------------------------------------------- verification
    /** Search-engine ownership verification tokens, rendered as meta tags. */
    verification: {
      google: { type: String, default: '', trim: true },
      bing: { type: String, default: '', trim: true },
      pinterest: { type: String, default: '', trim: true },
      yandex: { type: String, default: '', trim: true },
    },

    // --------------------------------------------------------------- schema
    /** Toggles for each structured-data type the renderer can emit. */
    schemaToggles: {
      faq: { type: Boolean, default: true },
      breadcrumb: { type: Boolean, default: true },
      service: { type: Boolean, default: true },
      article: { type: Boolean, default: true },
      organization: { type: Boolean, default: true },
    },

    /** Admin who last saved these settings. */
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true, collection: 'seo_settings' }
);

const SeoSetting = mongoose.model('SeoSetting', seoSettingSchema);

export default SeoSetting;
