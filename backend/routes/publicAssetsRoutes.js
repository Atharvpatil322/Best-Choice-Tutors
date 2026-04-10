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

  // Presigned S3 URLs expire quickly; never cache this redirect or browsers
  // keep following a stale Location header and images appear broken after TTL.
  res.set('Cache-Control', 'private, no-store');
  return res.redirect(302, signedUrl);
});

export default router;
