import express from 'express';
import { presignKey } from '../services/s3Service.js';

const router = express.Router();

const ALLOWED_PREFIXES = ['images/'];

router.get('/assets/*', async (req, res) => {
  const rawKey = req.params[0] || '';
  const key = rawKey.replace(/^\/+/, '');

  if (!key) {
    return res.status(400).json({ message: 'Missing asset key' });
  }

  if (!ALLOWED_PREFIXES.some((prefix) => key.startsWith(prefix))) {
    return res.status(403).json({ message: 'Asset not allowed' });
  }

  const signedUrl = await presignKey(key, 3600);
  if (!signedUrl) {
    return res.status(500).json({ message: 'Unable to sign asset' });
  }

  res.set('Cache-Control', 'private, max-age=300');
  return res.redirect(302, signedUrl);
});

export default router;
