import express from 'express';
import { handleRazorpayWebhook } from '../controllers/webhookController.js';

const router = express.Router();

// POST /api/webhooks/razorpay - Razorpay webhook endpoint
router.post('/razorpay', handleRazorpayWebhook);

export default router;

