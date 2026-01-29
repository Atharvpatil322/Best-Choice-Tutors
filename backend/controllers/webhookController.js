import { BookingError, updateBookingStatusFromRazorpayPaymentEvent } from '../services/bookingService.js';
import { verifyRazorpayWebhookSignature } from '../services/razorpayService.js';

/**
 * Razorpay webhook handler
 * Phase 5.4: POST /api/webhooks/razorpay
 *
 * Handles:
 * - payment.captured -> mark booking as PAID
 * - payment.failed -> mark booking as FAILED
 *
 * The booking is matched using razorpayOrderId (payment.entity.order_id).
 */
export const handleRazorpayWebhook = async (req, res, next) => {
  try {
    const signature = req.header('x-razorpay-signature');

    if (!signature) {
      return res.status(400).json({ message: 'Missing Razorpay signature header' });
    }

    // Razorpay expects signature verification against the raw request body.
    const payloadBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body);

    const isValid = verifyRazorpayWebhookSignature(payloadBody, signature);

    if (!isValid) {
      return res.status(400).json({ message: 'Invalid Razorpay signature' });
    }

    const { event, payload } = req.body;

    if (event === 'payment.captured') {
      await updateBookingStatusFromRazorpayPaymentEvent({
        payment: payload.payment.entity,
        targetStatus: 'PAID',
      });
    } else if (event === 'payment.failed') {
      await updateBookingStatusFromRazorpayPaymentEvent({
        payment: payload.payment.entity,
        targetStatus: 'FAILED',
      });
    }

    // Always respond 200 OK for valid, processed webhooks
    return res.status(200).json({ success: true });
  } catch (error) {
    if (error instanceof BookingError) {
      // For domain errors we still return 200 to avoid repeated retries,
      // but include the message for logging/inspection.
      return res.status(200).json({ success: false, message: error.message });
    }

    next(error);
  }
};

