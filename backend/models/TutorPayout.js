import mongoose from 'mongoose';

/**
 * Tutor Payout Model
 *
 * Records payout events received from Stripe (payout.paid) for tutor connected accounts.
 * Used for accurate paid-out totals, including partial/manual payouts from Stripe Dashboard.
 */
const tutorPayoutSchema = new mongoose.Schema(
  {
    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tutor',
      required: true,
      index: true,
    },
    payoutId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true, // smallest currency unit (e.g. pence)
      min: 0,
    },
    currency: {
      type: String,
      default: 'gbp',
      trim: true,
      lowercase: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

tutorPayoutSchema.index({ tutorId: 1, createdAt: -1 });

const TutorPayout = mongoose.model('TutorPayout', tutorPayoutSchema);

export default TutorPayout;
