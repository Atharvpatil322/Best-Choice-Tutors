import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Get encryption key from environment. Must be 32 bytes (64 hex chars or 32-byte base64).
 */
function getKey() {
  const raw = process.env.BANK_DETAILS_ENCRYPTION_KEY;
  if (!raw || typeof raw !== 'string') {
    throw new Error(
      'BANK_DETAILS_ENCRYPTION_KEY is not set. Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  const hexMatch = raw.match(/^[0-9a-fA-F]{64}$/);
  if (hexMatch) {
    return Buffer.from(raw, 'hex');
  }
  const buf = Buffer.from(raw, 'base64');
  if (buf.length !== KEY_LENGTH) {
    throw new Error(
      'BANK_DETAILS_ENCRYPTION_KEY must be 32 bytes (64 hex chars or 44 base64 chars)'
    );
  }
  return buf;
}

/**
 * Encrypt a plaintext string. Returns a single string: iv:authTag:ciphertext (base64).
 * @param {string} plaintext
 * @returns {string}
 */
export function encrypt(plaintext) {
  if (plaintext == null || typeof plaintext !== 'string') {
    throw new Error('encrypt expects a non-null string');
  }
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const enc = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('base64'), authTag.toString('base64'), enc.toString('base64')].join(':');
}

/**
 * Decrypt a string produced by encrypt().
 * @param {string} encrypted - iv:authTag:ciphertext (base64)
 * @returns {string}
 */
export function decrypt(encrypted) {
  if (encrypted == null || typeof encrypted !== 'string') {
    throw new Error('decrypt expects a non-null string');
  }
  const parts = encrypted.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted format');
  }
  const [ivB64, authTagB64, cipherB64] = parts;
  const key = getKey();
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(cipherB64, 'base64', 'utf8') + decipher.final('utf8');
}
