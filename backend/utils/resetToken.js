import crypto from 'crypto';

export const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

export const hashResetToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
