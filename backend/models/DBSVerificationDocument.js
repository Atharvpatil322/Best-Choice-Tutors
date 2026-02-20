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

// Enforce immutability: only status (APPROVED/REJECTED) may be updated by admin; no deletes
dbsVerificationDocumentSchema.pre(
  ['updateOne', 'updateMany', 'findOneAndUpdate', 'deleteOne', 'deleteMany', 'findOneAndDelete'],
  function (next) {
    const update = this.getUpdate?.();
    if (update == null || typeof update !== 'object') {
      return next(new Error('DBSVerificationDocument is immutable: updates and deletes are not allowed'));
    }
    const set = update.$set ?? update;
    const keys = typeof set === 'object' && set !== null ? Object.keys(set) : [];
    const onlyStatus =
      keys.length === 1 &&
      keys[0] === 'status' &&
      (set.status === 'APPROVED' || set.status === 'REJECTED');
    if (onlyStatus) return next();
    next(new Error('DBSVerificationDocument is immutable: only status (APPROVED/REJECTED) may be updated'));
  }
);

dbsVerificationDocumentSchema.set('versionKey', false);

const DBSVerificationDocument = mongoose.model(
  'DBSVerificationDocument',
  dbsVerificationDocumentSchema
);

export default DBSVerificationDocument;
