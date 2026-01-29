import Booking from '../models/Booking.js';
import Tutor from '../models/Tutor.js';
import { createRazorpayOrder } from './razorpayService.js';

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

  // Check for existing booking for this slot with status PENDING or PAID
  const existingBooking = await Booking.findOne({
    tutorId,
    date,
    startTime,
    endTime,
    status: { $in: ['PENDING', 'PAID'] },
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

  const parseMinutes = (timeStr) => {
    const [h, m] = String(timeStr).split(':').map(Number);
    return h * 60 + m;
  };

  const startMinutes = parseMinutes(booking.startTime);
  const endMinutes = parseMinutes(booking.endTime);

  if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes) || startMinutes >= endMinutes) {
    throw new BookingError('Invalid booking time range', 400);
  }

  const durationHours = (endMinutes - startMinutes) / 60;
  const amountInPaise = Math.round(Number(tutor.hourlyRate) * durationHours * 100);

  if (!Number.isInteger(amountInPaise) || amountInPaise <= 0) {
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
 * Update booking status based on a Razorpay payment event.
 *
 * Matches the booking using payment.entity.order_id -> Booking.razorpayOrderId
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
    // No associated booking found; not an error for webhook processing
    return null;
  }

  booking.status = targetStatus;
  await booking.save();

  return booking;
};

export { BookingError };

