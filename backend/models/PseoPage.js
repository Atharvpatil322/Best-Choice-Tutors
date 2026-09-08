import mongoose from 'mongoose';

/**
 * Programmatic SEO page
 *
 * One generated landing page combining a subject with a location, for example
 * "/maths-tutors-in-london". These target the long-tail searches parents
 * actually type, which the generic tutor search page cannot rank for.
 *
 * Pages are produced from a PseoTemplate and stored individually so each can be
 * edited, deactivated, or given bespoke copy without regenerating the set. The
 * generator never overwrites a page whose copy has been edited by hand
 * (`isCustomised`), so manual work is not lost on the next run.
 */

const pseoPageSchema = new mongoose.Schema(
  {
    /** Site-relative path, unique across all generated pages. */
    path: {
      type: String,
      required: [true, 'Path is required'],
      trim: true,
      lowercase: true,
      unique: true,
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PseoTemplate',
      default: null,
      index: true,
    },

    /** Variable values this page was generated from, kept for filtering. */
    subject: { type: String, default: '', trim: true, index: true },
    location: { type: String, default: '', trim: true, index: true },

    /** Rendered copy. */
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [400, 'Description cannot exceed 400 characters'],
    },
    heading: {
      type: String,
      default: '',
      trim: true,
      maxlength: [200, 'Heading cannot exceed 200 characters'],
    },
    intro: {
      type: String,
      default: '',
      trim: true,
      maxlength: [4000, 'Intro cannot exceed 4000 characters'],
    },

    /**
     * True once an admin edits the copy. The generator skips these so bespoke
     * wording survives a regeneration.
     */
    isCustomised: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true, collection: 'seo_pseo_pages' }
);

pseoPageSchema.index({ isActive: 1, subject: 1, location: 1 });

const PseoPage = mongoose.model('PseoPage', pseoPageSchema);

export default PseoPage;
