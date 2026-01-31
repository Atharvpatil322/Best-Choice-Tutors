import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { getReportedReviews } from '../controllers/adminController.js';

const router = express.Router();

// GET /api/admin/reported-reviews - List reported reviews (admin only, read-only)
router.get('/reported-reviews', authenticate, getReportedReviews);

export default router;
