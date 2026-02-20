import mongoose from 'mongoose';

/**
 * WithdrawalDeduction
 * Records approved withdrawal amounts so effective available balance = sum(available earnings) - sum(deductions).
 * TutorEarnings rows are never deleted or modified for withdrawals.
 */
const withdrawalDeductionSchema = new mongoose.Schema(
  {
    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tutor',
      required: [true, 'Tutor ID is required'],
      index: true,
    },
    withdrawalRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WithdrawalRequest',
      required: [true, 'Withdrawal request ID is required'],
      index: true,
    },
    amountInPaise: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
  },
  {
    timestamps: true,
    collection: 'withdrawal_deductions',
  }
);

const WithdrawalDeduction = mongoose.model('WithdrawalDeduction', withdrawalDeductionSchema);

export default WithdrawalDeduction;
