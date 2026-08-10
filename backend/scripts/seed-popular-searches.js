/**
 * Seed Popular Searches
 * Migrates the hardcoded popular tutor search keywords into the MongoDB database.
 * Run: node scripts/seed-popular-searches.js
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

const POPULAR_SEARCH_DATA = [
  { label: "Maths Tutor", query: "Mathematics", order: 1, isActive: true },
  { label: "Physics Tutor", query: "Physics", order: 2, isActive: true },
  { label: "Chemistry Tutor", query: "Chemistry", order: 3, isActive: true },
  { label: "Biology Tutor", query: "Biology", order: 4, isActive: true },
  { label: "English Tutor", query: "English", order: 5, isActive: true },
  { label: "Computer Science Tutor", query: "Computer Science", order: 6, isActive: true },
  { label: "History Tutor", query: "History", order: 7, isActive: true },
  { label: "Geography Tutor", query: "Geography", order: 8, isActive: true },
  { label: "GCSE Tutor", query: "GCSE", order: 9, isActive: true },
  { label: "A-Level Tutor", query: "A-Levels", order: 10, isActive: true },
  { label: "University Tutor", query: "University", order: 11, isActive: true },
  { label: "Language Tutor", query: "Languages", order: 12, isActive: true },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`Connected to MongoDB`);

    const PopularSearch = mongoose.model(
      "PopularSearch",
      new mongoose.Schema(
        {
          label: String,
          query: String,
          order: Number,
          isActive: Boolean,
          createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        },
        { timestamps: true }
      )
    );

    const existing = await PopularSearch.countDocuments({});
    console.log(`Existing popular searches: ${existing}`);

    const args = process.argv.slice(2);
    const force = args.includes("--force");

    if (force) {
      await PopularSearch.deleteMany({});
      console.log("Deleted all existing popular searches (--force)");
    } else if (existing > 0) {
      console.log(`Popular searches already exist (${existing}). Use --force to re-seed.`);
      await mongoose.disconnect();
      return;
    }

    await PopularSearch.insertMany(POPULAR_SEARCH_DATA);
    console.log(`Seeded ${POPULAR_SEARCH_DATA.length} popular searches successfully!`);
    POPULAR_SEARCH_DATA.forEach((item) => {
      console.log(`  - ${item.label}`);
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
