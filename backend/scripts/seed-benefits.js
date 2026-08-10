/**
 * Seed Benefits
 * Migrates the hardcoded "Why Choose Us" data into the MongoDB database.
 * Run: node scripts/seed-benefits.js
 * Add --force to re-seed (delete existing and re-insert).
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI not found in .env");
  process.exit(1);
}

const BENEFIT_DATA = [
  {
    title: "Verified Tutors",
    description:
      "All tutors undergo rigorous identity, qualification, and background checks before joining our platform.",
    icon: "BadgeCheck",
    order: 1,
    isActive: true,
  },
  {
    title: "Secure Payments",
    description:
      "Your transactions are protected with industry-standard security. Book with confidence knowing your payments are safe.",
    icon: "Shield",
    order: 2,
    isActive: true,
  },
  {
    title: "Personalised Matching",
    description:
      "We match you with tutors based on your subject, level, learning goals, and preferred teaching style.",
    icon: "Users",
    order: 3,
    isActive: true,
  },
  {
    title: "Flexible Scheduling",
    description:
      "Choose from online or in-person sessions that fit your schedule. Learn at your own pace, on your own time.",
    icon: "Clock",
    order: 4,
    isActive: true,
  },
  {
    title: "Expert Tutors",
    description:
      "Our tutors are experienced professionals and qualified educators with deep subject knowledge.",
    icon: "GraduationCap",
    order: 5,
    isActive: true,
  },
  {
    title: "Dedicated Support",
    description:
      "Our support team is here to help with bookings, tutor matching, and any questions you may have.",
    icon: "MessageSquare",
    order: 6,
    isActive: true,
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`Connected to MongoDB`);

    const Benefit = mongoose.model(
      "Benefit",
      new mongoose.Schema(
        {
          title: String,
          description: String,
          icon: String,
          order: Number,
          isActive: Boolean,
          createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        },
        { timestamps: true }
      )
    );

    const existing = await Benefit.countDocuments({});
    console.log(`Existing benefits: ${existing}`);

    const args = process.argv.slice(2);
    const force = args.includes("--force");

    if (force) {
      await Benefit.deleteMany({});
      console.log("Deleted all existing benefits (--force)");
    } else if (existing > 0) {
      console.log(`Benefits already exist (${existing}). Use --force to re-seed.`);
      await mongoose.disconnect();
      return;
    }

    await Benefit.insertMany(BENEFIT_DATA);
    console.log(`Seeded ${BENEFIT_DATA.length} benefit entries successfully!`);
    BENEFIT_DATA.forEach((benefit) => {
      console.log(`  - ${benefit.title}`);
    });

    await mongoose.disconnect();
    console.log("Done.");
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err.message || err);
    process.exit(1);
  }
}

seed();
