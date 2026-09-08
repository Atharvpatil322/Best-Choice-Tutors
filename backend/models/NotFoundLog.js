import mongoose from 'mongoose';

/**
 * Not Found Log
 *
 * Records paths that were requested but do not exist, aggregated one document
 * per path with a hit counter rather than one row per request. This keeps the
 * collection small on a site that attracts bot traffic while still showing
 * which broken links are worth creating a redirect for.
 *
 * Only genuine page misses are recorded; asset requests and API calls are
 * filtered out by the middleware before reaching here.
 */

const notFoundLogSchema = new mongoose.Schema(
  {
    /** Requested path, without query string. */
    path: {
      type: String,
      required: [true, 'Path is required'],
      trim: true,
      unique: true,
    },
    /** How many times this path has been requested. */
    hits: {
      type: Number,
      default: 1,
    },
    /** Referring URL from the most recent hit, when the browser supplied one. */
    lastReferrer: {
      type: String,
      default: '',
      trim: true,
    },
    /** User agent from the most recent hit, truncated to keep documents small. */
    lastUserAgent: {
      type: String,
      default: '',
      trim: true,
      maxlength: [300, 'User agent cannot exceed 300 characters'],
    },
    firstSeenAt: {
      type: Date,
      default: Date.now,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    /**
     * Set once a redirect has been created for this path, so the list can be
     * filtered down to misses that still need attention.
     */
    isResolved: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true, collection: 'seo_not_found_logs' }
);

const NotFoundLog = mongoose.model('NotFoundLog', notFoundLogSchema);

export default NotFoundLog;
