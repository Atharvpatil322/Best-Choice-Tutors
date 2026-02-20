import { BookingError, updateBookingStatusFromRazorpayPaymentEvent } from '../services/bookingService.js';
import { verifyRazorpayWebhookSignature } from '../services/razorpayService.js';

/**
 * Razorpay webhook handler
 * Phase 5.4: POST /api/webhooks/razorpay
 *
 * Handles:
 * - payment.captured -> mark booking as PAID
 * - payment.failed -> mark booking as FAILED (booking status only; wallet is never created or unlocked).
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
    // WARNING: JSON.stringify(req.body) fallback may invalidate signature verification if key order/whitespace differs from raw request.
    const payloadBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body);

    const isValid = verifyRazorpayWebhookSignature(payloadBody, signature);

    if (!isValid) {
      console.warn('Razorpay webhook: signature verification failed');
      return res.status(400).json({ message: 'Invalid Razorpay signature' });
    }

    const { event, payload } = req.body;

    console.info('Razorpay webhook received', { event: event || '(missing)' });

    // Defensive: validate payload.payment.entity before use
    const paymentEntity = payload?.payment?.entity;
    if (!paymentEntity) {
      console.warn('Razorpay webhook: payload.payment.entity missing', { event });
      return res.status(200).json({ success: false, message: 'Invalid payload structure' });
    }

    if (event === 'payment.captured') {
      const result = await updateBookingStatusFromRazorpayPaymentEvent({
        payment: paymentEntity,
        targetStatus: 'PAID',
      });
      if (result === null) {
        console.warn('Razorpay webhook: booking not found for order_id', {
          order_id: paymentEntity.order_id,
        });
      }
    } else if (event === 'payment.failed') {
      // payment.failed updates booking status to FAILED only. Wallet is never created or unlocked on payment.failed; no wallet rollback unless business rules change later.
      const result = await updateBookingStatusFromRazorpayPaymentEvent({
        payment: paymentEntity,
        targetStatus: 'FAILED',
      });
      if (result === null) {
        console.warn('Razorpay webhook: booking not found for order_id', {
          order_id: paymentEntity.order_id,
        });
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    if (error instanceof BookingError) {
      console.error('Razorpay webhook: BookingError', { message: error.message });
      return res.status(200).json({ success: false, message: error.message });
    }

    next(error);
  }
};

