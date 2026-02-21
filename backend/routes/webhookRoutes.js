import express from 'express';
import { handleStripeWebhook } from '../controllers/webhookController.js';

const router = express.Router();

// POST /api/webhooks/stripe - Stripe webhook (checkout.session.completed, payment_intent.succeeded, payment_intent.payment_failed, account.updated)
router.post('/stripe', handleStripeWebhook);

export default router;

