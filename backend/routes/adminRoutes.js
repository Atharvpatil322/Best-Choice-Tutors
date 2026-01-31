import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import {
  getReportedReviews,
  getDisputes,
  getDisputeById,
  resolveDisputeHandler,
} from '../controllers/adminController.js';

const router = express.Router();

// GET /api/admin/reported-reviews - List reported reviews (admin only, read-only)
router.get('/reported-reviews', authenticate, getReportedReviews);

// GET /api/admin/disputes - List disputes (admin only)
router.get('/disputes', authenticate, getDisputes);
// GET /api/admin/disputes/:disputeId - Get dispute detail (admin only)
router.get('/disputes/:disputeId', authenticate, getDisputeById);
// PATCH /api/admin/disputes/:disputeId/resolve - Resolve dispute (admin only, Phase 10)
router.patch('/disputes/:disputeId/resolve', authenticate, resolveDisputeHandler);

export default router;
