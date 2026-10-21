/**
 * Subject page
 *
 * One record per canonical subject, holding everything the admin can change
 * about that subject's public page: its URL slug, search listing (title and
 * description) and on-page copy.
 *
 * The subject name is the stable key and cannot change: tutor profiles,
 * FAQs and tuition requests all store subjects by name. Only the slug - the
 * part of the URL after /tutors/subject/ - is editable, and changing it is
 * handled by subjectService so the old address can redirect to the new one.
 */

import mongoose from 'mongoose';
import { CANONICAL_SUBJECTS } from '../constants/subjects.js';

/** Lowercase words joined by single hyphens, e.g. "computer-science". */
export const SUBJECT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      enum: CANONICAL_SUBJECTS,
    },
    slug: {
      type: String,
      required: [true, 'URL slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: [80, 'URL slug cannot exceed 80 characters'],
      match: [SUBJECT_SLUG_PATTERN, 'URL slug can only contain lowercase letters, numbers and single hyphens'],
    },
    /** Search result title. Blank uses "<Subject> Tutors | Best Choice Tutors". */
    seoTitle: { type: String, default: '', trim: true, maxlength: [120, 'Page title cannot exceed 120 characters'] },
    /** Search result description. Blank uses the shared tutor search description. */
    metaDescription: {
      type: String,
      default: '',
      trim: true,
      maxlength: [320, 'Meta description cannot exceed 320 characters'],
    },
    /** Main heading on the page. Blank uses the built-in heading. */
    h1: { type: String, default: '', trim: true, maxlength: [150, 'Heading cannot exceed 150 characters'] },
    /** Short paragraph under the heading. */
    intro: { type: String, default: '', trim: true, maxlength: [1000, 'Intro cannot exceed 1000 characters'] },
    /** Rich text shown below the tutor results, stored as HTML from the editor. */
    content: { type: String, default: '', maxlength: [50000, 'Content is too long'] },
    /** Share image for this page. */
    imageUrl: { type: String, default: '', trim: true, maxlength: 500 },
    imageAlt: { type: String, default: '', trim: true, maxlength: 250 },
    order: { type: Number, default: 0 },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  // optimisticConcurrency: a save fails if the record changed since it was
  // read, so two admins cannot both move the same page.
  { timestamps: true, collection: 'subjects', optimisticConcurrency: true },
);

subjectSchema.index({ order: 1 });

const Subject = mongoose.model('Subject', subjectSchema);
export default Subject;
