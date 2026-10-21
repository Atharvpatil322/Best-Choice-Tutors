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

    // ---------------------------------------------------------- organization
    /**
     * Business identity published as Organization and WebSite structured data
     * on the homepage. Every field is optional: blank fields are left out of
     * the markup rather than shipped as placeholders, and name, URL, logo and
     * description fall back to the brand defaults.
     */
    organization: {
      type: {
        type: String,
        enum: ['EducationalOrganization', 'Organization', 'OnlineBusiness', 'LocalBusiness'],
        default: 'EducationalOrganization',
      },
      name: { type: String, default: '', trim: true, maxlength: 200 },
      legalName: { type: String, default: '', trim: true, maxlength: 200 },
      alternateName: { type: String, default: '', trim: true, maxlength: 200 },
      slogan: { type: String, default: '', trim: true, maxlength: 200 },
      description: { type: String, default: '', trim: true, maxlength: 1000 },
      url: { type: String, default: '', trim: true, maxlength: 500 },
      logo: { type: String, default: '', trim: true, maxlength: 500 },
      image: { type: String, default: '', trim: true, maxlength: 500 },
      email: { type: String, default: '', trim: true, maxlength: 200 },
      telephone: { type: String, default: '', trim: true, maxlength: 50 },
      contactPoints: {
        type: [
          {
            _id: false,
            contactType: { type: String, default: '', trim: true, maxlength: 100 },
            telephone: { type: String, default: '', trim: true, maxlength: 50 },
            email: { type: String, default: '', trim: true, maxlength: 200 },
            areaServed: { type: String, default: '', trim: true, maxlength: 100 },
            availableLanguage: { type: [String], default: [] },
          },
        ],
        default: [],
      },
      /** No public premises: address, map position and opening hours are left out. */
      onlineOnly: { type: Boolean, default: false },
      address: {
        streetAddress: { type: String, default: '', trim: true, maxlength: 200 },
        addressLocality: { type: String, default: '', trim: true, maxlength: 100 },
        addressRegion: { type: String, default: '', trim: true, maxlength: 100 },
        postalCode: { type: String, default: '', trim: true, maxlength: 20 },
        addressCountry: { type: String, default: '', trim: true, maxlength: 2 },
      },
      geo: {
        latitude: { type: String, default: '', trim: true, maxlength: 20 },
        longitude: { type: String, default: '', trim: true, maxlength: 20 },
      },
      openingHours: {
        type: [
          {
            _id: false,
            days: { type: [String], default: [] },
            opens: { type: String, default: '', trim: true, maxlength: 5 },
            closes: { type: String, default: '', trim: true, maxlength: 5 },
          },
        ],
        default: [],
      },
      priceRange: { type: String, default: '', trim: true, maxlength: 50 },
      sameAs: { type: [String], default: [] },
      foundingDate: { type: String, default: '', trim: true, maxlength: 10 },
      founders: { type: [String], default: [] },
      areaServed: { type: [String], default: [] },
      knowsAbout: { type: [String], default: [] },
      companyNumber: { type: String, default: '', trim: true, maxlength: 50 },
      vatID: { type: String, default: '', trim: true, maxlength: 50 },
      taxID: { type: String, default: '', trim: true, maxlength: 50 },
      websiteName: { type: String, default: '', trim: true, maxlength: 200 },
      websiteAlternateName: { type: String, default: '', trim: true, maxlength: 200 },
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
