/**
 * Seed FAQs
 * Migrates the hardcoded FAQ data from faqData.js into the MongoDB database.
 * Run: node scripts/seed-faqs.js
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

const FAQ_DATA = [
  {
    question: "What tutoring services do you offer?",
    answer:
      "We provide personalized tutoring services for a wide range of subjects, including Math, English, Science, and test preparation, tailored to each student's learning needs.",
    link: "https://bestchoicetutors.com/subjects",
    order: 1,
    isActive: true,
  },
  {
    question: "Do you offer online tutoring?",
    answer:
      "Yes, we offer both online and in-person tutoring sessions, allowing students to learn from anywhere with flexible scheduling.",
    link: "https://bestchoicetutors.com/how-it-works",
    order: 2,
    isActive: true,
  },
  {
    question: "How do I choose the right tutor?",
    answer:
      "We match students with experienced tutors based on their academic goals, subject requirements, grade level, and learning preferences.",
    order: 3,
    isActive: true,
  },
  {
    question: "Which subjects do you cover?",
    answer:
      "Our tutors provide support in Mathematics, English, Science, Physics, Chemistry, Biology, SAT, ACT, AP courses, and many other subjects.",
    link: "https://bestchoicetutors.com/subjects",
    order: 4,
    isActive: true,
  },
  {
    question: "How can I book a tutoring session?",
    answer:
      "You can book a tutoring session by contacting us through our website, submitting an inquiry form, or reaching out to our support team.",
    link: "https://bestchoicetutors.com/onboarding",
    order: 5,
    isActive: true,
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`Connected to MongoDB`);

    const FAQ = mongoose.model(
      "FAQ",
      new mongoose.Schema(
        {
          question: String,
          answer: String,
          link: String,
          order: Number,
          isActive: Boolean,
          createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        },
        { timestamps: true }
      )
    );

    const existing = await FAQ.countDocuments({});
    console.log(`Existing FAQs: ${existing}`);

    const args = process.argv.slice(2);
    const force = args.includes("--force");

    if (force) {
      await FAQ.deleteMany({});
      console.log("Deleted all existing FAQs (--force)");
    } else if (existing > 0) {
      console.log(`FAQs already exist (${existing}). Use --force to re-seed.`);
      await mongoose.disconnect();
      return;
    }

    await FAQ.insertMany(FAQ_DATA);
    console.log(`Seeded ${FAQ_DATA.length} FAQ entries successfully!`);
    FAQ_DATA.forEach((faq) => {
      console.log(`  - ${faq.question}`);
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
