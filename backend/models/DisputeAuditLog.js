import mongoose from 'mongoose';

/**
 * Dispute Audit Log (Phase 10)
 *
 * Immutable append-only log of dispute actions.
 * Never update or delete. Only create.
 */

const disputeAuditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Actor ID is required'],
      index: true,
    },
    actorRole: {
      type: String,
      required: [true, 'Actor role is required'],
      enum: ['Learner', 'Tutor', 'Admin'],
      index: true,
    },
    disputeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dispute',
      required: [true, 'Dispute ID is required'],
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      enum: ['DISPUTE_CREATED', 'LEARNER_EVIDENCE_SUBMITTED', 'TUTOR_EVIDENCE_SUBMITTED', 'DISPUTE_RESOLVED'],
      index: true,
    },
    timestamp: {
      type: Date,
      default: () => new Date(),
      required: true,
    },
  },
  {
    timestamps: false,
    collection: 'dispute_audit_logs',
  }
);

// Compound index for querying by dispute
disputeAuditLogSchema.index({ disputeId: 1, timestamp: 1 });

// Enforce immutability: reject updates and deletes
disputeAuditLogSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate', 'deleteOne', 'deleteMany', 'findOneAndDelete'], function (next) {
  next(new Error('DisputeAuditLog is immutable: updates and deletes are not allowed'));
});

disputeAuditLogSchema.set('versionKey', false);

const DisputeAuditLog = mongoose.model('DisputeAuditLog', disputeAuditLogSchema);

export default DisputeAuditLog;
