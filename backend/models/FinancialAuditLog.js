import mongoose from "mongoose";

/** Actions that impact money state (do not use for read-only views). */
const ACTIONS = [
  "EARNINGS_CREATED",
  "EARNINGS_RELEASED",
  "WITHDRAWAL_REQUESTED",
  "WITHDRAWAL_APPROVED",
  "WITHDRAWAL_PAID",
  "WITHDRAWAL_REJECTED",
  "REFUND_FULL",
  "REFUND_PARTIAL",
];

const PERFORMED_BY = ["SYSTEM", "ADMIN"];

/**
 * FinancialAuditLog
 * Append-only log of every money-impacting event. Never update or delete.
 */
const financialAuditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: [true, "Action is required"],
      enum: ACTIONS,
      index: true,
    },
    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tutor",
      required: false,
      default: null,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: false,
      default: null,
      index: true,
    },
    withdrawalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WithdrawalRequest",
      required: false,
      default: null,
      index: true,
    },
    amountInPaise: {
      type: Number,
      required: [true, "Amount in paise is required"],
    },
    performedBy: {
      type: String,
      required: [true, "Performed by is required"],
      enum: PERFORMED_BY,
      index: true,
    },
    performedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
      index: true,
    },
    timestamp: {
      type: Date,
      default: () => new Date(),
      required: true,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: false,
    collection: "financial_audit_logs",
  },
);

financialAuditLogSchema.index({ tutorId: 1, timestamp: -1 });
financialAuditLogSchema.index({ action: 1, timestamp: -1 });

financialAuditLogSchema.pre(
  [
    "updateOne",
    "updateMany",
    "findOneAndUpdate",
    "deleteOne",
    "deleteMany",
    "findOneAndDelete",
  ],
  function (next) {
    next(
      new Error(
        "FinancialAuditLog is immutable: updates and deletes are not allowed",
      ),
    );
  },
);

const FinancialAuditLog = mongoose.model(
  "FinancialAuditLog",
  financialAuditLogSchema,
);

export default FinancialAuditLog;
export {
  ACTIONS as FINANCIAL_AUDIT_ACTIONS,
  PERFORMED_BY as FINANCIAL_AUDIT_PERFORMED_BY,
};
