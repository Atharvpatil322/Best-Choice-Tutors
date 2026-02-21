/**
 * One-off script: set a booking's status to COMPLETED by ID.
 * Usage: node scripts/complete-booking.js <bookingId>
 * Example: node scripts/complete-booking.js 674a1b2c3d4e5f6789abcdef
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';

dotenv.config();

const bookingId = process.argv[2];
if (!bookingId) {
  console.error('Usage: node scripts/complete-booking.js <bookingId>');
  process.exit(1);
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const result = await Booking.updateOne(
    { _id: new mongoose.Types.ObjectId(bookingId) },
    { $set: { status: 'COMPLETED' } }
  );
  if (result.matchedCount === 0) {
    console.error('No booking found with that ID.');
    process.exit(1);
  }
  console.log('Booking marked as COMPLETED.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
