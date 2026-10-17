import express from 'express';
import { getPublishedBlogs, getBlogBySlug } from '../controllers/blogController.js';

const router = express.Router();

// Public blog content changes rarely. Let browsers reuse it briefly and serve a
// stale copy while revalidating, so repeat visits and back-navigation are instant.
router.use((req, res, next) => {
  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  next();
});

// Public blog routes
// GET /api/blog - List published blogs
router.get('/', getPublishedBlogs);
// GET /api/blog/:slug - Get single blog by slug
router.get('/:slug', getBlogBySlug);

export default router;

