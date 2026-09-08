import mongoose from 'mongoose';

/**
 * Programmatic SEO template
 *
 * Defines how a set of landing pages is produced. The path and copy fields are
 * patterns containing `{subject}` and `{location}` placeholders; the generator
 * substitutes every combination of the configured subjects and locations to
 * produce one PseoPage per pair.
 *
 * Placeholders available in the copy fields:
 *   {subject}  {location}  - as entered, e.g. "Mathematics", "London"
 *   {Subject}  {Location}  - title-cased
 * The path pattern additionally slugifies whatever it substitutes.
 */

const pseoTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters'],
    },

    /** e.g. "/{subject}-tutors-in-{location}" */
    pathPattern: {
      type: String,
      required: [true, 'Path pattern is required'],
      trim: true,
    },
    /** e.g. "{Subject} Tutors in {Location} | Best Choice Tutors" */
    titlePattern: {
      type: String,
      required: [true, 'Title pattern is required'],
      trim: true,
    },
    descriptionPattern: {
      type: String,
      default: '',
      trim: true,
    },
    headingPattern: {
      type: String,
      default: '',
      trim: true,
    },
    introPattern: {
      type: String,
      default: '',
      trim: true,
      maxlength: [4000, 'Intro pattern cannot exceed 4000 characters'],
    },

    /** Values substituted into the patterns. */
    subjects: {
      type: [String],
      default: [],
    },
    locations: {
      type: [String],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    /** Result of the most recent generation run, shown in the admin panel. */
    lastGeneratedAt: {
      type: Date,
      default: null,
    },
    lastGeneratedCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true, collection: 'seo_pseo_templates' }
);

const PseoTemplate = mongoose.model('PseoTemplate', pseoTemplateSchema);

export default PseoTemplate;
