import mongoose from 'mongoose';

/** Withdrawal request status lifecycle: PENDING → APPROVED | REJECTED; APPROVED → PAID when paid out */
const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'PAID'];

/**
 * WithdrawalRequest Model
 * Tracks withdrawal lifecycle. TutorEarnings are NOT modified at request creation;
 * deduction/marking is handled when request is processed (e.g. APPROVED/PAID).
 */
const withdrawalRequestSchema = new mongoose.Schema(
  {
    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tutor',
      required: [true, 'Tutor ID is required'],
    },
    amountRequested: {
      type: Number,
      required: [true, 'Amount requested is required'],
      min: [0, 'Amount requested cannot be negative'],
    },
    status: {
      type: String,
      enum: STATUSES,
      default: 'PENDING',
      index: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    processedAt: {
      type: Date,
      default: null,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    transactionReference: {
      type: String,
      trim: true,
      default: null,
    },
    /** Masked bank details snapshot at request time (never store raw account/sort code). */
    bankDetailsSnapshot: {
      accountHolderName: { type: String, default: '' },
      bankName: { type: String, default: '' },
      country: { type: String, default: '' },
      maskedAccountNumber: { type: String, default: '****' },
      maskedSortCodeOrIfsc: { type: String, default: '****' },
    },
    notes: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'withdrawal_requests',
  }
);

// Atomic race guard: at most one PENDING per tutor (enforced by DB)
withdrawalRequestSchema.index(
  { tutorId: 1 },
  { unique: true, partialFilterExpression: { status: 'PENDING' } }
);
withdrawalRequestSchema.index({ tutorId: 1, status: 1 });
withdrawalRequestSchema.index({ status: 1, requestedAt: -1 });

const WithdrawalRequest = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);

export default WithdrawalRequest;
export { STATUSES as WITHDRAWAL_STATUSES };
