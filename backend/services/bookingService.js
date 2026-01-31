import Booking from '../models/Booking.js';
import Tutor from '../models/Tutor.js';
import TutorEarnings from '../models/TutorEarnings.js';
import { createRazorpayOrder } from './razorpayService.js';

/** Statuses that reserve a slot; only these block rebooking for the same slot */
const ACTIVE_SLOT_STATUSES = ['PENDING', 'PAID'];

/** Final states: no further transitions (cancellation UI not exposed yet) */
export const BOOKING_FINAL_STATUSES = ['COMPLETED', 'CANCELLED', 'NO_SHOW'];

/**
 * Review eligibility: canReview is true only when booking is COMPLETED and payment was PAID.
 * @param {Object} booking - Must have status
 * @returns {boolean}
 */
export const getCanReview = (booking) => {
  const status = booking.status;
  const paymentStatus =
    status === 'PAID' || status === 'COMPLETED' ? 'PAID' : status === 'FAILED' ? 'FAILED' : 'PENDING';
  return status === 'COMPLETED' && paymentStatus === 'PAID';
};

/**
 * Compute booking amount in paise from tutor hourly rate and booking duration.
 * @param {Object} booking - Must have startTime, endTime
 * @param {Object} tutor - Must have hourlyRate
 * @returns {number|null} Amount in paise, or null if time range invalid
 */
function getBookingAmountInPaise(booking, tutor) {
  const parseMinutes = (timeStr) => {
    const [h, m] = String(timeStr).split(':').map(Number);
    return h * 60 + m;
  };
  const startMinutes = parseMinutes(booking.startTime);
  const endMinutes = parseMinutes(booking.endTime);
  if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes) || startMinutes >= endMinutes) {
    return null;
  }
  const durationHours = (endMinutes - startMinutes) / 60;
  const amountInPaise = Math.round(Number(tutor.hourlyRate) * durationHours * 100);
  return Number.isInteger(amountInPaise) && amountInPaise > 0 ? amountInPaise : null;
}

/**
 * Domain error for booking-related failures
 */
class BookingError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'BookingError';
    this.statusCode = statusCode;
  }
}

/**
 * Create a booking for a given learner and slot.
 *
 * Business rules:
 * - Tutor must exist
 * - One booking per slot (tutorId + date + startTime + endTime)
 *   considering only status PENDING or PAID
 * - Booking is created with status PENDING (handled by schema default)
 *
 * @param {Object} params
 * @param {string} params.learnerId - Learner user ID (ObjectId string)
 * @param {string} params.tutorId - Tutor ID (ObjectId string)
 * @param {string} params.date - YYYY-MM-DD
 * @param {string} params.startTime - HH:mm
 * @param {string} params.endTime - HH:mm
 * @returns {Promise<Booking>}
 */
export const createBookingForSlot = async ({
  learnerId,
  tutorId,
  date,
  startTime,
  endTime,
}) => {
  // Verify tutor exists
  const tutor = await Tutor.findById(tutorId);
  if (!tutor) {
    throw new BookingError('Tutor not found', 404);
  }

  // Check for existing booking for this slot (only active statuses block)
  const existingBooking = await Booking.findOne({
    tutorId,
    date,
    startTime,
    endTime,
    status: { $in: ACTIVE_SLOT_STATUSES },
  });

  if (existingBooking) {
    throw new BookingError('This slot is already booked for this tutor', 409);
  }

  // Create booking with status PENDING (schema default)
  const booking = await Booking.create({
    learnerId,
    tutorId,
    date,
    startTime,
    endTime,
  });

  return booking;
};

/**
 * Create a Razorpay order for a booking.
 *
 * Business rules:
 * - Booking must exist
 * - Booking must belong to the learner initiating payment
 * - Booking status must be PENDING
 *
 * Note:
 * - This does NOT mark the booking as PAID.
 * - Webhook / payment verification will be handled in a later phase.
 *
 * @param {Object} params
 * @param {string} params.bookingId - Booking ID (ObjectId string)
 * @param {string} params.learnerId - Learner user ID initiating payment
 * @param {number} params.amount - Amount in paise
 * @returns {Promise<{ booking: Booking, order: Object }>}
 */
export const createPaymentOrderForBooking = async ({
  bookingId,
  learnerId,
}) => {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw new BookingError('Booking not found', 404);
  }

  // Ensure the booking belongs to the learner initiating the payment
  if (booking.learnerId.toString() !== learnerId.toString()) {
    throw new BookingError('You are not allowed to pay for this booking', 403);
  }

  if (booking.status !== 'PENDING') {
    throw new BookingError('Booking is not in PENDING status', 400);
  }

  // Calculate amount (in paise) from tutor hourlyRate and booking duration
  const tutor = await Tutor.findById(booking.tutorId);
  if (!tutor) {
    throw new BookingError('Tutor not found', 404);
  }

  const amountInPaise = getBookingAmountInPaise(booking, tutor);
  if (amountInPaise === null) {
    throw new BookingError('Invalid booking time range', 400);
  }

  if (amountInPaise <= 0) {
    throw new BookingError('Unable to calculate amount for this booking', 400);
  }

  const order = await createRazorpayOrder({
    amount: amountInPaise,
    currency: 'INR',
    receipt: booking._id.toString(),
  });

  booking.razorpayOrderId = order.id;
  await booking.save();

  return { booking, order };
};

/**
 * Update booking status based on a Razorpay payment event (payment.captured / payment.failed).
 *
 * Wallet lifecycle rule 1: On payment.captured we set booking.status = PAID and create
 * a tutor wallet ledger entry with status "pendingRelease" only. Wallet MUST NOT be set
 * to "available" on payment; that happens only on session completion. Frontend Razorpay
 * success callback MUST NOT update wallet; wallet state depends only on backend logic.
 *
 * Matches the booking using payment.entity.order_id -> Booking.razorpayOrderId.
 * Idempotent for webhook retries: duplicate webhooks do not create duplicate ledger entries.
 *
 * @param {Object} params
 * @param {Object} params.payment - Razorpay payment entity
 * @param {'PAID' | 'FAILED'} params.targetStatus - Target booking status
 * @returns {Promise<Booking|null>} Updated booking or null if not found
 */
export const updateBookingStatusFromRazorpayPaymentEvent = async ({
  payment,
  targetStatus,
}) => {
  const orderId = payment?.order_id;

  if (!orderId) {
    throw new BookingError('Razorpay payment payload missing order_id', 400);
  }

  const booking = await Booking.findOne({ razorpayOrderId: orderId });

  if (!booking) {
    return null;
  }

  const wasPaid = booking.status === 'PAID';
  booking.status = targetStatus;
  await booking.save();

  // Wallet lifecycle 1: On PAID only — create ledger entry with pendingRelease (never available).
  // payment.failed: wallet is never created or unlocked; no wallet rollback unless business rules change later.
  // Idempotent: $setOnInsert so duplicate webhooks do not create duplicate entries.
  if (targetStatus === 'PAID' && !wasPaid) {
    const tutor = await Tutor.findById(booking.tutorId);
    const amountInPaise = tutor ? getBookingAmountInPaise(booking, tutor) : null;
    if (amountInPaise != null && amountInPaise > 0) {
      await TutorEarnings.findOneAndUpdate(
        { bookingId: booking._id },
        {
          $setOnInsert: {
            tutorId: booking.tutorId,
            bookingId: booking._id,
            amount: amountInPaise,
            status: 'pendingRelease', // MUST stay pendingRelease until session completion
          },
        },
        { upsert: true }
      );
      console.info('Wallet ledger entry created for booking', {
        bookingId: booking._id.toString(),
        tutorId: booking.tutorId.toString(),
        amount: amountInPaise,
      });
    }
  }
  // On FAILED: do not create or modify wallet.

  return booking;
};

/**
 * Buffer (in minutes) after session end before marking a PAID booking as COMPLETED.
 * Session is considered ended at booking.date + booking.endTime; after this many
 * minutes past that time, status transitions PAID → COMPLETED.
 */
const COMPLETION_BUFFER_MINUTES = 15;

/**
 * Get the Date representing session end + buffer for a booking.
 * Uses booking.date (YYYY-MM-DD) and booking.endTime (HH:mm), interpreted as local time.
 *
 * @param {Object} booking - Must have date and endTime
 * @returns {Date} Session end time plus buffer
 */
export const getSessionEndPlusBuffer = (booking) => {
  const { date, endTime } = booking;
  const sessionEnd = new Date(`${date}T${endTime}:00`);
  if (Number.isNaN(sessionEnd.getTime())) {
    return new Date(0);
  }
  return new Date(sessionEnd.getTime() + COMPLETION_BUFFER_MINUTES * 60 * 1000);
};

/**
 * Mark all PAID bookings whose session end + buffer has passed as COMPLETED.
 *
 * Wallet lifecycle rule 3: On session completion (booking.status = COMPLETED), transition
 * the corresponding wallet entry from pendingRelease → available only. Idempotent: we only
 * update entries that are currently pendingRelease.
 *
 * @returns {Promise<{ updated: number }>} Number of bookings updated
 */
export const completeEligibleBookings = async () => {
  const now = new Date();
  const paidBookings = await Booking.find({ status: 'PAID' }).lean();

  let updated = 0;
  for (const b of paidBookings) {
    const sessionEndPlusBuffer = getSessionEndPlusBuffer(b);
    if (sessionEndPlusBuffer.getTime() <= now.getTime()) {
      await Booking.updateOne({ _id: b._id }, { status: 'COMPLETED' });
      // Wallet: pendingRelease → available only; match status so idempotent on retries
      const walletResult = await TutorEarnings.updateOne(
        { bookingId: b._id, status: 'pendingRelease' },
        { $set: { status: 'available' } }
      );
      if (walletResult.modifiedCount > 0) {
        console.info('Wallet entry transitioned pendingRelease → available', {
          bookingId: b._id.toString(),
        });
      }
      updated += 1;
    }
  }

  return { updated };
};

export { BookingError };

