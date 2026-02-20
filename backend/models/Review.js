import mongoose from 'mongoose';

/**
 * Review Model (Phase 8)
 * One review per completed booking. Written only by the learner.
 * Linked to bookingId, tutorId, learnerId.
 * Moderation: reporting fields only (no status enums or admin action fields).
 *
 * One-review-per-session: unique index on (bookingId, learnerId) enforces at DB level.
 * Duplicate attempt → MongoDB E11000 → return validation error. Reviews are create-only; no updates or edits.
 */

const reviewSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking ID is required'],
    },
    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tutor',
      required: [true, 'Tutor ID is required'],
    },
    learnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Learner ID is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be between 1 and 5 (inclusive)'],
      max: [5, 'Rating must be between 1 and 5 (inclusive)'],
      validate: {
        validator(v) {
          return typeof v === 'number' && Number.isFinite(v) && v >= 1 && v <= 5;
        },
        message: 'Rating must be a number between 1 and 5 (inclusive)',
      },
    },
    reviewText: {
      type: String,
      default: '',
      trim: true,
      maxlength: [2000, 'Review text must be at most 2000 characters'],
    },
    // Moderation: reporting
    isReported: {
      type: Boolean,
      default: false,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reportedReason: {
      type: String,
      default: null,
      trim: true,
    },
    reportedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// One review per learner per booking (enforced at DB level; duplicate → E11000)
reviewSchema.index({ bookingId: 1, learnerId: 1 }, { unique: true });
// List reviews by tutor (newest first)
reviewSchema.index({ tutorId: 1, createdAt: -1 });

// No updates allowed after initial report: reject any save that changes report fields when already reported
reviewSchema.pre('save', async function () {
  if (!this.isReported || this.isNew) return;
  const existing = await this.constructor
    .findById(this._id)
    .select('isReported reportedBy reportedReason reportedAt')
    .lean();
  if (!existing || !existing.isReported) return;
  const sameReason =
    (this.reportedReason ?? null) === (existing.reportedReason ?? null);
  const sameBy =
    (this.reportedBy && existing.reportedBy &&
     this.reportedBy.toString() === existing.reportedBy.toString()) ||
    (!this.reportedBy && !existing.reportedBy);
  const sameAt =
    (this.reportedAt && existing.reportedAt &&
     this.reportedAt.getTime() === new Date(existing.reportedAt).getTime()) ||
    (!this.reportedAt && !existing.reportedAt);
  if (!sameBy || !sameReason || !sameAt) {
    const err = new Error('No updates allowed after a review has been reported');
    err.name = 'ValidationError';
    throw err;
  }
});

const Review = mongoose.model('Review', reviewSchema);

export default Review;
