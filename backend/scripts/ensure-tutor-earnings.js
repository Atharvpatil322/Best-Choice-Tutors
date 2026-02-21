/**
 * One-off script: ensure a TutorEarnings doc exists for a PAID booking.
 * Use when a booking was set to PAID manually (e.g. in DB) and no earnings record was created.
 * Calls handleBookingPaid(booking), which is idempotent and will upsert the TutorEarnings entry.
 *
 * Usage: node scripts/ensure-tutor-earnings.js <bookingId>
 * Example: node scripts/ensure-tutor-earnings.js 699a10699b543877789af514
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import { handleBookingPaid } from '../services/bookingService.js';

dotenv.config();

const bookingId = process.argv[2];
if (!bookingId) {
  console.error('Usage: node scripts/ensure-tutor-earnings.js <bookingId>');
  process.exit(1);
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    console.error('No booking found with that ID.');
    process.exit(1);
  }
  if (booking.status !== 'PAID') {
    console.error('Booking is not PAID. TutorEarnings are only created for PAID bookings.');
    process.exit(1);
  }

  await handleBookingPaid(booking);
  console.log('TutorEarnings ensured for booking', bookingId);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
