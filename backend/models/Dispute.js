import mongoose from 'mongoose';

/**
 * Dispute Model
 * Phase 10: Dispute Resolution
 *
 * One dispute per booking. Linked to exactly one booking.
 */

const disputeSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking ID is required'],
      unique: true,
    },
    learnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Learner ID is required'],
      index: true,
    },
    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tutor',
      required: [true, 'Tutor ID is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['OPEN', 'RESOLVED'],
      default: 'OPEN',
      index: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    learnerEvidence: {
      type: String,
      default: null,
      trim: true,
    },
    tutorEvidence: {
      type: String,
      default: null,
      trim: true,
    },
    outcome: {
      type: String,
      enum: ['FULL_REFUND', 'PARTIAL_REFUND', 'RELEASE_PAYMENT_TO_TUTOR'],
      default: null,
    },
    refundAmountInPaise: {
      type: Number,
      default: null,
      min: [0, 'Refund amount cannot be negative'],
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// unique: true on bookingId already creates the index

const Dispute = mongoose.model('Dispute', disputeSchema);

export default Dispute;
