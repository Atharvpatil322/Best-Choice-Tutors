/**
 * Create a tutor test account
 *
 * Creates the User (role Tutor) and its Tutor profile, plus a weekly
 * availability schedule so the account can actually receive bookings. The
 * profile is marked verified, which is what an admin approval would do, so the
 * tutor appears in search results straight away.
 *
 * Safe to re-run: an existing account with the same email has its password
 * reset and its profile left in place, rather than being duplicated.
 *
 * Usage, from the backend directory:
 *   node scripts/create-tutor-account.js
 *   node scripts/create-tutor-account.js tutor@test.com MyPass123
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error('MONGO_URI not found in backend/.env');
  process.exit(1);
}

const EMAIL = (process.argv[2] || 'tutor@test.com').toLowerCase();
const PASSWORD = process.argv[3] || 'Tutor@123';

/** Monday to Friday, 09:00-17:00. Sunday is 0, so 1-5 is the working week. */
const WEEKLY_RULES = [1, 2, 3, 4, 5].map((dayOfWeek) => ({
  dayOfWeek,
  startTime: '09:00',
  endTime: '17:00',
}));

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const { default: User } = await import('../models/User.js');
  const { default: Tutor } = await import('../models/Tutor.js');
  const { default: Availability } = await import('../models/Availability.js');
  const { hashPassword } = await import('../utils/password.js');

  const hashed = await hashPassword(PASSWORD);

  let user = await User.findOne({ email: EMAIL });
  if (user) {
    // Re-run: reset the password and make sure the account can still log in.
    user.password = hashed;
    user.authProvider = 'email';
    user.role = 'Tutor';
    user.status = 'ACTIVE';
    await user.save();
    console.log(`User already existed - password reset (${EMAIL})`);
  } else {
    user = await User.create({
      name: 'Test Tutor',
      email: EMAIL,
      password: hashed,
      authProvider: 'email',
      role: 'Tutor',
      status: 'ACTIVE',
      phone: { countryCode: '+44', number: '7700900123' },
      gender: 'FEMALE',
    });
    console.log(`User created (${EMAIL})`);
  }

  let tutor = await Tutor.findOne({ userId: user._id });
  if (tutor) {
    console.log('Tutor profile already existed - left unchanged');
  } else {
    tutor = await Tutor.create({
      userId: user._id,
      fullName: 'Test Tutor',
      bio: 'Maths and Science tutor for GCSE and A-Level students. Test account.',
      subjects: ['Mathematics', 'Physics', 'Science'],
      experienceYears: 6,
      qualifications: [
        { title: 'BSc Mathematics', institution: 'University of Manchester', year: '2016' },
      ],
      hourlyRate: 35,
      mode: 'Both',
      location: {
        type: 'Point',
        coordinates: [-2.2426, 53.4808], // Manchester
        address: 'Manchester, UK',
      },
      // Marked as an admin approval would leave it, so the profile is listed.
      isVerified: true,
    });
    console.log('Tutor profile created');
  }

  const availability = await Availability.findOne({ tutorId: tutor._id });
  if (availability) {
    console.log('Availability already existed - left unchanged');
  } else {
    await Availability.create({
      tutorId: tutor._id,
      timezone: 'Europe/London',
      weeklyRules: WEEKLY_RULES,
    });
    console.log('Availability created (Mon-Fri, 09:00-17:00 Europe/London)');
  }

  console.log('\n--- Login details ---');
  console.log(`Email:    ${EMAIL}`);
  console.log(`Password: ${PASSWORD}`);
  console.log(`Role:     Tutor`);
  console.log(`Tutor ID: ${tutor._id}`);
  console.log(`User ID:  ${user._id}`);

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('Failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
