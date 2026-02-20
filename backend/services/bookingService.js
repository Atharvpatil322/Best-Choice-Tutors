import Booking from '../models/Booking.js';
import Dispute from '../models/Dispute.js';
import Tutor from '../models/Tutor.js';
import TutorEarnings from '../models/TutorEarnings.js';
import TuitionRequest from '../models/TuitionRequest.js';
import TutorInterest from '../models/TutorInterest.js';
import PlatformConfig from '../models/PlatformConfig.js';
import Availability from '../models/Availability.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { createRazorpayOrder } from './razorpayService.js';
import { logFinancialAudit } from './financialAuditService.js';

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
 * Parse duration from booking start/end time; return duration in hours or null if invalid.
 * @param {Object} booking - Must have startTime, endTime
 * @returns {number|null}
 */
function getDurationHours(booking) {
  const parseMinutes = (timeStr) => {
    const [h, m] = String(timeStr).split(':').map(Number);
    return h * 60 + m;
  };
  const startMinutes = parseMinutes(booking.startTime);
  const endMinutes = parseMinutes(booking.endTime);
  if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes) || startMinutes >= endMinutes) {
    return null;
  }
  return (endMinutes - startMinutes) / 60;
}

/**
 * Compute booking amount in paise from agreed hourly rate and booking duration.
 * Used for all new bookings (agreedHourlyRate set at creation). Backward compat: use tutor rate when agreedHourlyRate missing.
 * @param {Object} booking - Must have startTime, endTime; optional agreedHourlyRate
 * @param {Object} [tutor] - Must have hourlyRate when booking.agreedHourlyRate is missing
 * @returns {number|null} Amount in paise, or null if time range invalid or rate missing
 */
function getBookingAmountInPaise(booking, tutor) {
  const durationHours = getDurationHours(booking);
  if (durationHours == null) return null;
  const rate = booking.agreedHourlyRate != null
    ? Number(booking.agreedHourlyRate)
    : tutor ? Number(tutor.hourlyRate) : null;
  if (rate == null || !Number.isFinite(rate)) return null;
  const amountInPaise = Math.round(rate * durationHours * 100);
  return Number.isInteger(amountInPaise) && amountInPaise > 0 ? amountInPaise : null;
}

/**
 * Compute booking amount in paise from booking.agreedHourlyRate only (no tutor lookup).
 * @param {Object} booking - Must have startTime, endTime, agreedHourlyRate
 * @returns {number|null} Amount in paise, or null if invalid/missing
 */
function getBookingAmountInPaiseFromBooking(booking) {
  if (booking.agreedHourlyRate == null || !Number.isFinite(Number(booking.agreedHourlyRate))) {
    return null;
  }
  return getBookingAmountInPaise(booking, null);
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
 * - If requestId provided: request must exist, ACTIVE, belong to learner; tutor must have expressed interest.
 *   Then agreedHourlyRate = request.budget. Otherwise agreedHourlyRate = tutor.hourlyRate.
 *
 * @param {Object} params
 * @param {string} params.learnerId - Learner user ID (ObjectId string)
 * @param {string} params.tutorId - Tutor ID (ObjectId string)
 * @param {string} params.date - YYYY-MM-DD
 * @param {string} params.startTime - HH:mm
 * @param {string} params.endTime - HH:mm
 * @param {string} [params.requestId] - Optional tuition request ID for negotiated pricing
 * @returns {Promise<Booking>}
 */
export const createBookingForSlot = async ({
  learnerId,
  tutorId,
  date,
  startTime,
  endTime,
  requestId,
}) => {
  // Verify tutor exists
  const tutor = await Tutor.findById(tutorId);
  if (!tutor) {
    throw new BookingError('Tutor not found', 404);
  }

  let agreedHourlyRate = Number(tutor.hourlyRate);
  let tuitionRequestId = null;

  if (requestId) {
    const request = await TuitionRequest.findById(requestId).lean();
    if (!request) {
      throw new BookingError('Tuition request not found', 404);
    }
    if (request.learnerId.toString() !== learnerId.toString()) {
      throw new BookingError('This tuition request does not belong to you', 403);
    }
    if (request.status !== 'ACTIVE') {
      throw new BookingError('This tuition request is no longer active', 400);
    }
    const interest = await TutorInterest.findOne({ requestId, tutorId });
    if (!interest) {
      throw new BookingError('This tutor has not expressed interest in your request', 400);
    }
    agreedHourlyRate = Number(request.budget);
    tuitionRequestId = request._id;
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

  const booking = await Booking.create({
    learnerId,
    tutorId,
    date,
    startTime,
    endTime,
    agreedHourlyRate,
    tuitionRequestId,
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

  // Use agreedHourlyRate (request-based or tutor default); fallback to tutor for legacy bookings
  let amountInPaise = getBookingAmountInPaiseFromBooking(booking);
  if (amountInPaise === null) {
    const tutor = await Tutor.findById(booking.tutorId);
    if (!tutor) {
      throw new BookingError('Tutor not found', 404);
    }
    amountInPaise = getBookingAmountInPaise(booking, tutor);
  }
  if (amountInPaise === null) {
    throw new BookingError('Invalid booking time range', 400);
  }

  if (amountInPaise <= 0) {
    throw new BookingError('Unable to calculate amount for this booking', 400);
  }

  const order = await createRazorpayOrder({
    amount: amountInPaise,
    currency: 'GBP',
    receipt: booking._id.toString(),
  });

  booking.razorpayOrderId = order.id;
  await booking.save();

  return { booking, order };
};

/**
 * Central handler for when a booking becomes PAID.
 * Call this from Razorpay webhook (payment.captured) and from DEV test override only.
 * Idempotent: safe to call multiple times; duplicate calls do not double-credit earnings.
 *
 * Handles: earnings (TutorEarnings pendingRelease), booking integrity, tuition request
 * closure, commission snapshot. Chat eligibility and completion timer depend on status PAID
 * (no extra work here). Dispute window starts from session completion (unchanged).
 *
 * @param {import('mongoose').Document} booking - Booking document (must be loaded)
 * @param {{ razorpayPaymentId?: string }} [options] - Payment metadata when from Razorpay
 * @returns {Promise<Booking>} The same booking document (possibly saved)
 */
export async function handleBookingPaid(booking, options = {}) {
  const alreadyPaid = booking.status === 'PAID';

  // Idempotent: if already PAID, ensure earnings exist and tuition request closed, then return
  if (alreadyPaid) {
    let amountInPaise = getBookingAmountInPaiseFromBooking(booking);
    if (amountInPaise == null) {
      const tutor = await Tutor.findById(booking.tutorId);
      amountInPaise = tutor ? getBookingAmountInPaise(booking, tutor) : null;
    }
    if (amountInPaise != null && amountInPaise > 0) {
      const config = await PlatformConfig.findOne().lean();
      const commissionRate = config?.commissionRate ?? 0;
      const commissionInPaise = Math.round((amountInPaise * commissionRate) / 100);
      await TutorEarnings.findOneAndUpdate(
        { bookingId: booking._id },
        {
          $setOnInsert: {
            tutorId: booking.tutorId,
            bookingId: booking._id,
            amount: amountInPaise,
            status: 'pendingRelease',
            commissionInPaise,
          },
        },
        { upsert: true }
      );
    }
    if (booking.tuitionRequestId) {
      await TuitionRequest.updateOne(
        { _id: booking.tuitionRequestId },
        { $set: { status: 'CLOSED' } }
      );
    }
    return booking;
  }

  booking.status = 'PAID';
  if (options.razorpayPaymentId) {
    booking.razorpayPaymentId = options.razorpayPaymentId;
  }
  await booking.save();

  // Amount from booking.agreedHourlyRate only (never tutor.hourlyRate for new flow)
  let amountInPaise = getBookingAmountInPaiseFromBooking(booking);
  if (amountInPaise == null) {
    const tutor = await Tutor.findById(booking.tutorId);
    amountInPaise = tutor ? getBookingAmountInPaise(booking, tutor) : null;
  }
  if (amountInPaise != null && amountInPaise > 0) {
    const config = await PlatformConfig.findOne().lean();
    const commissionRate = config?.commissionRate ?? 0;
    const commissionInPaise = Math.round((amountInPaise * commissionRate) / 100);
    await TutorEarnings.findOneAndUpdate(
      { bookingId: booking._id },
      {
        $setOnInsert: {
          tutorId: booking.tutorId,
          bookingId: booking._id,
          amount: amountInPaise,
          status: 'pendingRelease',
          commissionInPaise,
        },
      },
      { upsert: true }
    );
    await logFinancialAudit({
      action: 'EARNINGS_CREATED',
      tutorId: booking.tutorId,
      bookingId: booking._id,
      amountInPaise,
      performedBy: 'SYSTEM',
    });
    console.info('Wallet ledger entry created for booking', {
      bookingId: booking._id.toString(),
      tutorId: booking.tutorId.toString(),
      amount: amountInPaise,
    });
  }

  if (booking.tuitionRequestId) {
    await TuitionRequest.updateOne(
      { _id: booking.tuitionRequestId },
      { $set: { status: 'CLOSED' } }
    );
  }

  return booking;
}

/**
 * Central handler for when a booking payment fails.
 * Call from Razorpay webhook (payment.failed) and from DEV test override.
 * No earnings, no wallet, no tuition request change.
 *
 * @param {import('mongoose').Document} booking - Booking document
 * @param {{ razorpayPaymentId?: string }} [options]
 * @returns {Promise<Booking>}
 */
export async function handleBookingFailed(booking, options = {}) {
  booking.status = 'FAILED';
  if (options.razorpayPaymentId) {
    booking.razorpayPaymentId = options.razorpayPaymentId;
  }
  await booking.save();
  return booking;
}

/**
 * Update booking status based on a Razorpay payment event (payment.captured / payment.failed).
 * Delegates to handleBookingPaid / handleBookingFailed so all payment-dependent logic is central.
 *
 * @param {Object} params
 * @param {Object} params.payment - Razorpay payment entity (order_id, id)
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

  if (targetStatus === 'PAID') {
    await handleBookingPaid(booking, { razorpayPaymentId: payment?.id ?? undefined });
    return booking;
  }
  if (targetStatus === 'FAILED') {
    await handleBookingFailed(booking, { razorpayPaymentId: payment?.id ?? undefined });
    return booking;
  }
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
 * Transition TutorEarnings from pendingRelease → available for a booking.
 * Phase 10: Never credits wallet when an OPEN dispute exists.
 * Wallet balance remains unchanged until dispute is resolved.
 *
 * @param {mongoose.Types.ObjectId} bookingId
 * @returns {Promise<boolean>} true if transition was performed, false if skipped (e.g. dispute OPEN)
 */
export async function releaseWalletForBooking(bookingId) {
  const openDispute = await Dispute.findOne({ bookingId, status: 'OPEN' });
  if (openDispute) {
    return false;
  }
  return releaseWalletForBookingInternal(bookingId);
}

/**
 * Release wallet without dispute check. For admin dispute resolution (RELEASE_PAYMENT_TO_TUTOR) or cron completion.
 * @param {mongoose.Types.ObjectId} bookingId
 * @param {{ performedBy?: 'SYSTEM'|'ADMIN', performedById?: import('mongoose').Types.ObjectId }} [auditOpts] - For financial audit; default SYSTEM
 * @returns {Promise<boolean>}
 */
export async function releaseWalletForBookingInternal(bookingId, auditOpts = {}) {
  const entry = await TutorEarnings.findOne({ bookingId, status: 'pendingRelease' }).lean();
  const result = await TutorEarnings.updateOne(
    { bookingId, status: 'pendingRelease' },
    { $set: { status: 'available' } }
  );
  if (result.modifiedCount > 0 && entry) {
    await logFinancialAudit({
      action: 'EARNINGS_RELEASED',
      tutorId: entry.tutorId,
      bookingId,
      amountInPaise: entry.amount,
      performedBy: auditOpts.performedBy || 'SYSTEM',
      performedById: auditOpts.performedById,
    });
  }
  return result.modifiedCount > 0;
}

/**
 * Mark TutorEarnings as refunded (FULL_REFUND). Excludes from tutor wallet.
 *
 * @param {mongoose.Types.ObjectId} bookingId
 * @returns {Promise<boolean>}
 */
export async function markTutorEarningsRefunded(bookingId) {
  const result = await TutorEarnings.updateOne(
    { bookingId, status: 'pendingRelease' },
    { $set: { status: 'refunded' } }
  );
  return result.modifiedCount > 0;
}

/**
 * Release partial amount to tutor (PARTIAL_REFUND). Updates ledger to net amount and sets available.
 *
 * @param {mongoose.Types.ObjectId} bookingId
 * @param {number} netAmountInPaise - Amount tutor receives (original - refundAmount)
 * @param {{ performedBy?: 'SYSTEM'|'ADMIN', performedById?: import('mongoose').Types.ObjectId }} [auditOpts] - For financial audit
 * @returns {Promise<boolean>}
 */
export async function releasePartialToTutor(bookingId, netAmountInPaise, auditOpts = {}) {
  if (!Number.isInteger(netAmountInPaise) || netAmountInPaise < 0) {
    return false;
  }
  const entry = await TutorEarnings.findOne({ bookingId, status: 'pendingRelease' }).lean();
  const result = await TutorEarnings.updateOne(
    { bookingId, status: 'pendingRelease' },
    { $set: { amount: netAmountInPaise, status: 'available' } }
  );
  if (result.modifiedCount > 0 && entry && netAmountInPaise > 0) {
    await logFinancialAudit({
      action: 'EARNINGS_RELEASED',
      tutorId: entry.tutorId,
      bookingId,
      amountInPaise: netAmountInPaise,
      performedBy: auditOpts.performedBy || 'SYSTEM',
      performedById: auditOpts.performedById,
    });
  }
  return result.modifiedCount > 0;
}

/**
 * Mark all PAID bookings whose session end + buffer has passed as COMPLETED.
 *
 * Wallet lifecycle rule 3: On session completion (booking.status = COMPLETED), transition
 * the corresponding wallet entry from pendingRelease → available only. Idempotent: we only
 * update entries that are currently pendingRelease.
 * Phase 10: TutorEarnings must NOT transition to available while dispute is OPEN.
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
      // Phase 10: Skip completion if an OPEN dispute exists — keep escrow frozen
      const openDispute = await Dispute.findOne({ bookingId: b._id, status: 'OPEN' });
      if (openDispute) {
        continue;
      }

      await Booking.updateOne({ _id: b._id }, { status: 'COMPLETED' });
      // Wallet: use centralised release; never credits when dispute OPEN
      const released = await releaseWalletForBooking(b._id);
      if (released) {
        console.info('Wallet entry transitioned pendingRelease → available', {
          bookingId: b._id.toString(),
        });
      }
      updated += 1;
    }
  }

  return { updated };
};

/**
 * Check if two time slots overlap
 * @param {string} start1 - HH:mm
 * @param {string} end1 - HH:mm
 * @param {string} start2 - HH:mm
 * @param {string} end2 - HH:mm
 * @returns {boolean} True if slots overlap
 */
function doSlotsOverlap(start1, end1, start2, end2) {
  // Two slots overlap if one starts before the other ends
  // and one ends after the other starts
  return start1 < end2 && end1 > start2;
}

/**
 * Check if a time slot is within tutor's availability
 * @param {Object} availability - Availability document
 * @param {string} date - YYYY-MM-DD
 * @param {string} startTime - HH:mm
 * @param {string} endTime - HH:mm
 * @returns {boolean}
 */
function isSlotWithinAvailability(availability, date, startTime, endTime) {
  if (!availability) return false;

  // Parse YYYY-MM-DD as calendar date so day-of-week is correct in any timezone
  const [y, m, d] = date.split('-').map(Number);
  const dayOfWeek = new Date(y, m - 1, d).getDay(); // 0 = Sunday, 6 = Saturday

  // Find exceptions for this date
  const exceptions = availability.exceptions.filter(
    (exception) => exception.date === date
  );

  // Check for override exception first
  const overrideException = exceptions.find(
    (exception) => exception.type === 'override'
  );

  if (overrideException) {
    return (
      startTime >= overrideException.startTime &&
      endTime <= overrideException.endTime
    );
  }

  // Check for unavailable exception
  const unavailableExceptions = exceptions.filter(
    (exception) => exception.type === 'unavailable'
  );

  for (const exception of unavailableExceptions) {
    if (
      !(endTime <= exception.startTime || startTime >= exception.endTime)
    ) {
      return false;
    }
  }

  // Find weekly rule for this day
  const weeklyRule = availability.weeklyRules.find(
    (rule) => rule.dayOfWeek === dayOfWeek
  );

  if (!weeklyRule) return false;

  return (
    startTime >= weeklyRule.startTime && endTime <= weeklyRule.endTime
  );
}

/**
 * Reschedule a booking to a new date/time slot
 *
 * Business rules:
 * - Booking must exist and belong to learner
 * - Booking status must be PAID
 * - Booking must not be COMPLETED or CANCELLED
 * - Booking must not be under dispute
 * - Cannot reschedule within 24 hours before the original session start time
 * - New date/time must be in the future
 * - New slot must be within tutor's availability
 * - New slot must not conflict with other tutor bookings
 *
 * @param {Object} params
 * @param {string} params.bookingId - Booking ID (ObjectId string)
 * @param {string} params.learnerId - Learner user ID (ObjectId string)
 * @param {string} params.date - New date YYYY-MM-DD
 * @param {string} params.startTime - New start time HH:mm
 * @param {string} params.endTime - New end time HH:mm
 * @returns {Promise<Booking>} Updated booking
 */
export const rescheduleBooking = async ({
  bookingId,
  learnerId,
  date,
  startTime,
  endTime,
}) => {
  console.log('[Reschedule] Service called', { bookingId, date, startTime, endTime });

  // Find booking
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    console.log('[Reschedule] Booking not found', bookingId);
    throw new BookingError('Booking not found', 404);
  }
  console.log('[Reschedule] Booking found', { status: booking.status, date: booking.date, startTime: booking.startTime, endTime: booking.endTime });

  // Verify booking belongs to learner
  if (booking.learnerId.toString() !== learnerId.toString()) {
    console.log('[Reschedule] Rejected: not learner\'s booking');
    throw new BookingError('You are not allowed to reschedule this booking', 403);
  }

  // Verify booking status is PAID
  if (booking.status !== 'PAID') {
    console.log('[Reschedule] Rejected: status is not PAID', { status: booking.status });
    throw new BookingError(
      `Cannot reschedule booking with status ${booking.status}. Only PAID bookings can be rescheduled.`,
      400
    );
  }

  // Verify booking is not COMPLETED or CANCELLED (redundant check but explicit)
  if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
    throw new BookingError(
      'Cannot reschedule a completed or cancelled booking',
      400
    );
  }

  // Check 24-hour rescheduling restriction
  // Learner cannot reschedule within 24 hours before session start
  const originalSessionStart = new Date(`${booking.date}T${booking.startTime}:00`);
  const now = new Date();
  const hoursUntilSession = (originalSessionStart - now) / (1000 * 60 * 60);
  
  if (hoursUntilSession <= 24) {
    console.log('[Reschedule] Rejected: within 24h of session', { hoursUntilSession, originalSessionStart: booking.date + ' ' + booking.startTime });
    throw new BookingError(
      'Cannot reschedule within 24 hours before the session start time',
      400
    );
  }

  // Check if booking is under dispute
  const dispute = await Dispute.findOne({
    bookingId: booking._id,
    status: 'OPEN',
  });
  if (dispute) {
    console.log('[Reschedule] Rejected: booking is under dispute');
    throw new BookingError(
      'Cannot reschedule a booking that is under dispute',
      400
    );
  }

  // Validate new date/time format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

  if (!dateRegex.test(date)) {
    console.log('[Reschedule] Rejected: invalid date format', date);
    throw new BookingError('Date must be in YYYY-MM-DD format', 400);
  }

  if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
    console.log('[Reschedule] Rejected: invalid time format', { startTime, endTime });
    throw new BookingError('Times must be in HH:mm format', 400);
  }

  if (startTime >= endTime) {
    console.log('[Reschedule] Rejected: startTime >= endTime');
    throw new BookingError('startTime must be before endTime', 400);
  }

  const newSlotDateTime = new Date(`${date}T${startTime}:00`);
  if (newSlotDateTime <= now) {
    console.log('[Reschedule] Rejected: new slot not in future');
    throw new BookingError(
      'New booking date and time must be in the future',
      400
    );
  }

  const tutor = await Tutor.findById(booking.tutorId);
  if (!tutor) {
    console.log('[Reschedule] Rejected: tutor not found');
    throw new BookingError('Tutor not found', 404);
  }

  const availability = await Availability.findOne({
    tutorId: booking.tutorId,
  });

  if (!availability) {
    console.log('[Reschedule] Rejected: tutor has no availability set');
    throw new BookingError(
      'Tutor has not set availability. Cannot reschedule to this slot.',
      400
    );
  }

  if (!isSlotWithinAvailability(availability, date, startTime, endTime)) {
    console.log('[Reschedule] Rejected: slot not within tutor availability');
    throw new BookingError(
      'The selected time slot is not within the tutor\'s availability',
      400
    );
  }

  // Check for overlapping bookings on the same date
  // Must check for overlaps, not just exact matches
  const existingBookings = await Booking.find({
    tutorId: booking.tutorId,
    date,
    status: { $in: ACTIVE_SLOT_STATUSES }, // PENDING or PAID
    _id: { $ne: booking._id }, // Exclude the current booking
  });

  // Check for overlaps with active bookings (PENDING or PAID)
  for (const existingBooking of existingBookings) {
    if (
      doSlotsOverlap(
        startTime,
        endTime,
        existingBooking.startTime,
        existingBooking.endTime
      )
    ) {
      const statusLabel = existingBooking.status === 'PAID' ? 'confirmed' : 'pending';
      console.log('[Reschedule] Rejected: slot overlaps with existing booking', { existing: existingBooking._id.toString() });
      throw new BookingError(
        `This time slot overlaps with an existing ${statusLabel} booking`,
        409
      );
    }
  }

  // Log changed slot (before → after)
  console.log('[Reschedule] All checks passed, updating DB');
  console.log('[Reschedule] Changed slot', {
    bookingId: booking._id.toString(),
    from: { date: booking.date, startTime: booking.startTime, endTime: booking.endTime },
    to: { date, startTime, endTime },
  });

  // Update booking in database: set new date and time (selected slot)
  const updatedBooking = await Booking.findByIdAndUpdate(
    bookingId,
    { $set: { date, startTime, endTime } },
    { new: true, runValidators: true }
  );

  if (!updatedBooking) {
    console.log('[Reschedule] findByIdAndUpdate returned null');
    throw new BookingError('Booking not found after update', 500);
  }
  console.log('[Reschedule] DB updated successfully', { date: updatedBooking.date, startTime: updatedBooking.startTime, endTime: updatedBooking.endTime });

  // Create in-app notification for tutor (API-based; tutor sees it when they open dashboard)
  const oldDate = booking.date;
  const oldStart = booking.startTime;
  const oldEnd = booking.endTime;
  try {
    const tutor = await Tutor.findById(updatedBooking.tutorId).lean();
    if (tutor && tutor.userId) {
      const learner = await User.findById(learnerId).select('name').lean();
      const learnerName = learner?.name || 'A learner';
      const fromText = `${oldDate} ${oldStart}-${oldEnd}`;
      const toText = `${date} ${startTime}-${endTime}`;
      await Notification.create({
        userId: tutor.userId,
        type: 'booking_rescheduled',
        title: 'Session rescheduled',
        message: `${learnerName} rescheduled: from ${fromText} to ${toText}`,
        data: {
          bookingId: updatedBooking._id.toString(),
          from: { date: oldDate, startTime: oldStart, endTime: oldEnd },
          to: { date, startTime, endTime },
        },
      });
    }
  } catch (notifErr) {
    console.error('Failed to create reschedule notification:', notifErr.message);
  }

  return updatedBooking;
};

export { BookingError };

