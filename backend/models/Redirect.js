import mongoose from 'mongoose';

/**
 * Redirect
 *
 * Maps an old URL path to a new destination so links published elsewhere keep
 * working after a route changes. Matched by middleware before the single-page
 * app handler, so a redirect is issued without the browser loading the SPA.
 *
 * `hits` and `lastHitAt` let the SEO team see which redirects are still earning
 * traffic and which are safe to retire.
 */

const redirectSchema = new mongoose.Schema(
  {
    /** Path to match, always stored with a leading slash and no query string. */
    sourcePath: {
      type: String,
      required: [true, 'Source path is required'],
      trim: true,
      unique: true,
    },
    /** Destination: a site-relative path or an absolute external URL. */
    targetUrl: {
      type: String,
      required: [true, 'Target URL is required'],
      trim: true,
    },
    /**
     * 301 tells search engines the move is permanent and transfers ranking.
     * 302/307 signal a temporary move and preserve the original URL's ranking.
     */
    statusCode: {
      type: Number,
      enum: [301, 302, 307, 308],
      default: 301,
    },
    /**
     * 'exact'  - the path must match exactly
     * 'prefix' - matches the path and everything beneath it, preserving the remainder
     * 'regex'  - full regular-expression match (advanced)
     */
    matchType: {
      type: String,
      enum: ['exact', 'prefix', 'regex'],
      default: 'exact',
    },
    /** Free-text reminder of why the redirect exists. */
    note: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Note cannot exceed 500 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    /** Number of times this redirect has been served. */
    hits: {
      type: Number,
      default: 0,
    },
    lastHitAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true, collection: 'seo_redirects' }
);

// sourcePath already declares unique, which creates the lookup index.
redirectSchema.index({ isActive: 1, matchType: 1 });

const Redirect = mongoose.model('Redirect', redirectSchema);

export default Redirect;
