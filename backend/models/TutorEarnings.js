import mongoose from 'mongoose';

/**
 * Tutor Earnings (Wallet Ledger) Model
 *
 * Ledger-only record of tutor earnings per booking. No withdrawals, no bank details.
 * One entry per booking; status moves from pendingRelease to available when released.
 * Phase 10: 'refunded' status for FULL_REFUND disputes (tutor receives nothing).
 */

const tutorEarningsSchema = new mongoose.Schema(
  {
    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tutor',
      required: [true, 'Tutor ID is required'],
      index: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking ID is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be non-negative'],
    },
    status: {
      type: String,
      enum: ['pendingRelease', 'available', 'refunded'],
      default: 'pendingRelease',
      index: true,
    },
    /** Platform commission snapshot (paise) at time of booking payment. Used for revenue reporting. */
    commissionInPaise: {
      type: Number,
      default: 0,
      min: [0, 'Commission cannot be negative'],
    },
    /** Stripe Transfer ID (e.g. tr_xxx) after payout to tutor Connect account. Set when status becomes available. */
    stripeTransferId: {
      type: String,
      default: null,
      trim: true,
    },
    /** Stripe Payout ID (e.g. po_xxx) when manual payout is sent to tutor's bank via Stripe Dashboard. */
    payoutId: {
      type: String,
      default: null,
      trim: true,
    },
    /** Date when payout was sent to tutor's bank (from payout.paid webhook). */
    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// One ledger entry per booking
tutorEarningsSchema.index({ bookingId: 1 }, { unique: true });

const TutorEarnings = mongoose.model('TutorEarnings', tutorEarningsSchema);

export default TutorEarnings;
