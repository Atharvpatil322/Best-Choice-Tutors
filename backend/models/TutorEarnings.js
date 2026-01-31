import mongoose from 'mongoose';

/**
 * Tutor Earnings (Wallet Ledger) Model
 *
 * Ledger-only record of tutor earnings per booking. No withdrawals, no bank details.
 * One entry per booking; status moves from pendingRelease to available when released.
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
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be non-negative'],
    },
    status: {
      type: String,
      enum: ['pendingRelease', 'available'],
      default: 'pendingRelease',
      index: true,
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
