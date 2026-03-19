import mongoose from 'mongoose';

/**
 * DBSVerificationDocument Model
 * Stores DBS (Disclosure and Barring Service) verification documents for tutors.
 * One tutor can have multiple DBS documents. Documents are immutable after upload.
 */

const dbsVerificationDocumentSchema = new mongoose.Schema(
  {
    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tutor',
      required: [true, 'Tutor ID is required'],
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
    },
    fileType: {
      type: String,
      required: [true, 'File type is required'],
      enum: {
        values: ['PDF', 'IMAGE'],
        message: 'File type must be PDF or IMAGE',
      },
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
      trim: true,
    },
    storageKey: {
      type: String,
      required: [true, 'Storage key is required'],
      trim: true,
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['PENDING', 'APPROVED', 'REJECTED'],
        message: 'Status must be PENDING, APPROVED, or REJECTED',
      },
      default: 'PENDING',
      index: true,
    },
    /**
     * DBS expiry date submitted by the tutor, stored while verification is pending.
     * Moved to `expiryDate` only when the admin approves the document.
     */
    expiryDatePending: {
      type: Date,
      default: null,
      index: true,
    },
    /**
     * Official DBS expiry date.
     * Stored only after admin approval (when status becomes APPROVED).
     */
    expiryDate: {
      type: Date,
      default: null,
      index: true,
      required: function () {
        return this.status === 'APPROVED' || this.isVerified === true;
      },
    },
    /**
     * Verification state used for expiry tracking.
     * (Tutor-level DBS badge flag is `Tutor.isDbsVerified`.)
     */
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    verifiedAt: {
      type: Date,
      default: null,
      index: true,
    },
    expiredAt: {
      type: Date,
      default: null,
      index: true,
    },
    /**
     * Marks that the tutor has already received the "DBS expired" notification for this doc.
     * Used to avoid duplicate notifications.
     */
    expiredNotifiedAt: {
      type: Date,
      default: null,
      index: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
  },
  {
    timestamps: false,
    collection: 'dbs_verification_documents',
  }
);

dbsVerificationDocumentSchema.index({ tutorId: 1, uploadedAt: -1 });
dbsVerificationDocumentSchema.index({ isVerified: 1, expiryDate: 1, tutorId: 1 });

// Enforce immutability: allow only specific DBS verification fields to be updated.
// - Admin approves/rejects: status (+ official expiry/isVerified metadata on APPROVE)
// - System expiry cron: isVerified + expiry notification markers (no status change)
dbsVerificationDocumentSchema.pre(
  ['updateOne', 'updateMany', 'findOneAndUpdate', 'deleteOne', 'deleteMany', 'findOneAndDelete'],
  function (next) {
    const update = this.getUpdate?.();
    if (update == null || typeof update !== 'object') {
      return next(new Error('DBSVerificationDocument is immutable: updates and deletes are not allowed'));
    }
    const set = update.$set ?? update;
    const keys = typeof set === 'object' && set !== null ? Object.keys(set) : [];

    const allowedUpdateKeys = new Set([
      // Admin approval/rejection
      'status',
      'expiryDate',
      'expiryDatePending',
      'isVerified',
      'verifiedAt',
      // System expiry job
      'expiredAt',
      'expiredNotifiedAt',
    ]);

    // Allow cron job updates (no status change) for expiry tracking
    const cronKeysAllowed = new Set(['isVerified', 'expiredAt', 'expiredNotifiedAt']);
    const hasStatusKey = keys.includes('status');

    if (!hasStatusKey) {
      const onlyCronKeys = keys.length > 0 && keys.every((k) => cronKeysAllowed.has(k));
      if (onlyCronKeys) return next();
    }

    // Admin updates include `status`
    if (hasStatusKey) {
      const status = set.status;
      if (status !== 'APPROVED' && status !== 'REJECTED') {
        return next(new Error('DBSVerificationDocument is immutable: invalid status update'));
      }

      // Admin rejection: only `status` is allowed.
      if (status === 'REJECTED') {
        const onlyStatus =
          keys.length === 1 && keys[0] === 'status';
        if (onlyStatus) return next();
        return next(new Error('DBSVerificationDocument is immutable: only status may be updated on REJECT'));
      }

      // Admin approval: allow status + verification metadata (expiryDate + isVerified + verifiedAt).
      if (status === 'APPROVED') {
        const keysAreAllowed = keys.every((k) => allowedUpdateKeys.has(k));
        if (!keysAreAllowed) {
          return next(
            new Error(
              'DBSVerificationDocument is immutable: invalid fields may not be updated on APPROVE',
            ),
          );
        }
        return next();
      }
    }

    next(
      new Error(
        'DBSVerificationDocument is immutable: updates are restricted to DBS verification fields',
      ),
    );
  }
);

dbsVerificationDocumentSchema.set('versionKey', false);

const DBSVerificationDocument = mongoose.model(
  'DBSVerificationDocument',
  dbsVerificationDocumentSchema
);

export default DBSVerificationDocument;
