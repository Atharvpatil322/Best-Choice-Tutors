import TutorBankDetails from '../models/TutorBankDetails.js';
import { encrypt, decrypt } from './encryptionService.js';

/**
 * Mask account number: show only last 4 digits, e.g. ****1234
 * @param {string} accountNumber - Full account number (digits only or with spaces)
 * @returns {string}
 */
export function maskAccountNumber(accountNumber) {
  if (accountNumber == null || typeof accountNumber !== 'string') {
    return '****';
  }
  const digits = accountNumber.replace(/\D/g, '');
  if (digits.length === 0) return '****';
  const last4 = digits.slice(-4);
  return last4.length === 4 ? `****${last4}` : '****';
}

/**
 * Mask sort code (e.g. 12-34-56 -> ****56) or IFSC (11 chars -> ****X1234)
 * @param {string} value
 * @returns {string}
 */
export function maskSortCodeOrIfsc(value) {
  if (value == null || typeof value !== 'string') {
    return '****';
  }
  const cleaned = value.replace(/\s|-/g, '');
  if (cleaned.length === 0) return '****';
  const last4 = cleaned.slice(-4);
  return last4.length === 4 ? `****${last4}` : '****';
}

/**
 * Create or update bank details for a tutor. Encrypts sensitive fields before save.
 * @param {import('mongoose').Types.ObjectId} tutorId
 * @param {Object} plain - accountHolderName, bankName, accountNumber, sortCodeOrIfsc, country
 * @returns {Promise<import('mongoose').Document>}
 */
export async function createOrUpdateBankDetails(tutorId, plain) {
  const accountNumberEncrypted = encrypt(plain.accountNumber);
  const sortCodeOrIfscEncrypted = encrypt(plain.sortCodeOrIfsc);

  const doc = await TutorBankDetails.findOneAndUpdate(
    { tutorId },
    {
      accountHolderName: plain.accountHolderName.trim(),
      bankName: plain.bankName.trim(),
      accountNumberEncrypted,
      sortCodeOrIfscEncrypted,
      country: String(plain.country).trim().toUpperCase(),
      verified: false, // Reset verification on update; admin can set verified later if needed
    },
    { new: true, upsert: true, runValidators: true }
  );
  return doc;
}

/**
 * Get bank details for a tutor. Returns only safe, masked fields. Never returns raw account number or sort code/IFSC.
 * @param {import('mongoose').Types.ObjectId} tutorId
 * @returns {Promise<Object|null>} { accountHolderName, bankName, country, verified, maskedAccountNumber, maskedSortCodeOrIfsc, createdAt, updatedAt } or null
 */
export async function getBankDetailsForTutor(tutorId) {
  const doc = await TutorBankDetails.findOne({ tutorId }).lean();
  if (!doc) return null;

  let maskedAccountNumber = '****';
  let maskedSortCodeOrIfsc = '****';
  try {
    const accountNumber = decrypt(doc.accountNumberEncrypted);
    maskedAccountNumber = maskAccountNumber(accountNumber);
  } catch {
    // If decryption fails (e.g. key rotated), keep masked as ****
  }
  try {
    const sortCodeOrIfsc = decrypt(doc.sortCodeOrIfscEncrypted);
    maskedSortCodeOrIfsc = maskSortCodeOrIfsc(sortCodeOrIfsc);
  } catch {
    // same
  }

  return {
    id: doc._id.toString(),
    accountHolderName: doc.accountHolderName,
    bankName: doc.bankName,
    country: doc.country,
    verified: !!doc.verified,
    maskedAccountNumber,
    maskedSortCodeOrIfsc,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * Check if tutor has bank details on file (for withdrawal eligibility).
 * @param {import('mongoose').Types.ObjectId} tutorId
 * @returns {Promise<boolean>}
 */
export async function hasBankDetails(tutorId) {
  const exists = await TutorBankDetails.exists({ tutorId });
  return !!exists;
}
