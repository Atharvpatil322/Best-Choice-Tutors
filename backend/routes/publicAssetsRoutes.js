import express from 'express';
import { presignKey } from '../services/s3Service.js';
import {
  getSeoConfigByPath,
  getPseoPageByPath,
  getSeoHead,
  getSeoPaths,
} from '../controllers/publicSeoController.js';
import { getPublicPageContent } from '../controllers/pageContentController.js';
import { publicCache } from '../middlewares/publicCache.js';

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

  // The signed URL is valid for an hour and changes on every request, so an
  // uncached redirect costs a server round trip per image and gives the browser
  // a new image URL each time, defeating its image cache. Cache the redirect for
  // half the signing window: it is reused, but a stale Location header can never
  // outlive the signature, which was the cause of broken images before.
  res.set('Cache-Control', 'private, max-age=1800');
  return res.redirect(302, signedUrl);
});

// Public SEO endpoint for page-specific metadata lookup.
router.get('/seo', publicCache(300, 600), getSeoConfigByPath);
// Content for a generated landing page, looked up by its path.
router.get('/pseo', publicCache(300, 600), getPseoPageByPath);
// Finished head tags per URL, and the list of URLs, for the frontend build.
router.get('/seo-head', getSeoHead);
router.get('/seo-paths', getSeoPaths);

// Public page copy, so components can render admin-edited content.
router.get('/page-content/:pageKey', publicCache(60, 300), getPublicPageContent);

export default router;
