import mongoose from 'mongoose';

/**
 * Tutor Bank Details (one per tutor)
 * Sensitive fields (accountNumber, sortCodeOrIfsc) are stored encrypted.
 * Never expose raw values in API responses; use masked versions only.
 */

const tutorBankDetailsSchema = new mongoose.Schema(
  {
    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tutor',
      required: [true, 'Tutor ID is required'],
      unique: true,
      index: true,
    },
    accountHolderName: {
      type: String,
      required: [true, 'Account holder name is required'],
      trim: true,
    },
    bankName: {
      type: String,
      required: [true, 'Bank name is required'],
      trim: true,
    },
    /** Encrypted account number. Decrypt only server-side to generate masked value. */
    accountNumberEncrypted: {
      type: String,
      required: [true, 'Account number is required'],
    },
    /** Encrypted sort code (UK) or IFSC (India). Stored as single field; meaning depends on country. */
    sortCodeOrIfscEncrypted: {
      type: String,
      required: [true, 'Sort code or IFSC is required'],
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      uppercase: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'tutor_bank_details',
  }
);

// Ensure no accidental projection of encrypted fields in toJSON/toObject
tutorBankDetailsSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.accountNumberEncrypted;
    delete ret.sortCodeOrIfscEncrypted;
    return ret;
  },
});

const TutorBankDetails = mongoose.model('TutorBankDetails', tutorBankDetailsSchema);

export default TutorBankDetails;
