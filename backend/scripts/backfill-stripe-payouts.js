/**
 * One-off script: backfill Stripe payout events into TutorPayout.
 *
 * Usage:
 *   node scripts/backfill-stripe-payouts.js
 *   node scripts/backfill-stripe-payouts.js --tutorId=<mongo_tutor_id>
 *   node scripts/backfill-stripe-payouts.js --maxPages=5 --pageSize=100
 *
 * Notes:
 * - Reads connected account payouts directly from Stripe API.
 * - Upserts by payoutId (idempotent).
 * - Requires MONGO_URI and STRIPE_SECRET_KEY in environment.
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Tutor from '../models/Tutor.js';
import TutorPayout from '../models/TutorPayout.js';
import { listConnectedAccountPayouts } from '../services/stripeService.js';

dotenv.config();

function parseArgs(argv) {
  const out = {
    tutorId: null,
    maxPages: 1,
    pageSize: 100,
  };
  for (const arg of argv) {
    if (arg.startsWith('--tutorId=')) out.tutorId = arg.split('=')[1] || null;
    if (arg.startsWith('--maxPages=')) out.maxPages = Math.max(1, Number(arg.split('=')[1]) || 1);
    if (arg.startsWith('--pageSize=')) out.pageSize = Math.min(100, Math.max(1, Number(arg.split('=')[1]) || 100));
  }
  return out;
}

async function upsertPayout({ tutorId, payout }) {
  const payoutId = payout?.id;
  if (!payoutId) return { created: false, skipped: true };
  const paidAt = payout.arrival_date ? new Date(payout.arrival_date * 1000) : new Date();

  const result = await TutorPayout.updateOne(
    { payoutId },
    {
      $setOnInsert: {
        tutorId,
        payoutId,
        amount: Number(payout.amount) || 0,
        currency: String(payout.currency || 'gbp').toLowerCase(),
        paidAt,
      },
    },
    { upsert: true }
  );

  const created = (result.upsertedCount || 0) > 0;
  return { created, skipped: !created };
}

async function backfillTutorPayouts(tutor, { maxPages, pageSize }) {
  const tutorId = tutor._id;
  const accountId = tutor.stripeAccountId;
  if (!accountId) return { tutorId: tutorId.toString(), scanned: 0, created: 0, skipped: 0 };

  let scanned = 0;
  let created = 0;
  let skipped = 0;
  let startingAfter = undefined;
  let page = 0;

  while (page < maxPages) {
    page += 1;
    const resp = await listConnectedAccountPayouts(accountId, {
      limit: pageSize,
      startingAfter,
    });
    const data = resp?.data || [];
    if (data.length === 0) break;

    for (const payout of data) {
      scanned += 1;
      const r = await upsertPayout({ tutorId, payout });
      if (r.created) created += 1;
      else skipped += 1;
    }

    if (!resp.has_more) break;
    startingAfter = data[data.length - 1]?.id;
    if (!startingAfter) break;
  }

  return { tutorId: tutorId.toString(), scanned, created, skipped };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing in environment');
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is missing in environment');
  }

  await mongoose.connect(process.env.MONGO_URI);

  const query = {
    stripeAccountId: { $exists: true, $ne: null },
  };
  if (args.tutorId) {
    query._id = args.tutorId;
  }

  const tutors = await Tutor.find(query).select('_id stripeAccountId').lean();
  if (tutors.length === 0) {
    console.log('No tutors found for backfill.');
    process.exit(0);
  }

  console.log(`Backfilling payouts for ${tutors.length} tutor(s)...`);
  let totalScanned = 0;
  let totalCreated = 0;
  let totalSkipped = 0;

  for (const tutor of tutors) {
    const stats = await backfillTutorPayouts(tutor, {
      maxPages: args.maxPages,
      pageSize: args.pageSize,
    });
    totalScanned += stats.scanned;
    totalCreated += stats.created;
    totalSkipped += stats.skipped;
    console.log(
      `Tutor ${stats.tutorId}: scanned=${stats.scanned} created=${stats.created} skipped=${stats.skipped}`
    );
  }

  console.log(
    `Done. scanned=${totalScanned} created=${totalCreated} skipped=${totalSkipped}`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error('Backfill failed:', err?.message || err);
  process.exit(1);
});
