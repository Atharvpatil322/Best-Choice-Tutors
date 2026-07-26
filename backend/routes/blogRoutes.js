import express from 'express';
import { getPublishedBlogs, getBlogBySlug } from '../controllers/blogController.js';

const router = express.Router();

// Public blog routes
// GET /api/blog - List published blogs
router.get('/', getPublishedBlogs);
// GET /api/blog/:slug - Get single blog by slug
router.get('/:slug', getBlogBySlug);

export default router;

