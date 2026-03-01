/**
 * Migration: Normalize all subjects across Tutor, User (subjectsOfInterest), TuitionRequest.
 * Run from backend dir: node scripts/normalize-subjects.js
 * Requires MONGODB_URI in .env
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "..", ".env") });

// Inline subject normalization (same logic as subjectUtils)
function toTitleCase(str) {
  if (!str || typeof str !== "string") return "";
  return str
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function normalizeSubject(subject) {
  if (subject == null || typeof subject !== "string") return "";
  const trimmed = String(subject).trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  return toTitleCase(trimmed).slice(0, 80);
}

function normalizeSubjects(arr) {
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  return arr
    .map((s) => normalizeSubject(s))
    .filter((s) => {
      if (!s || seen.has(s)) return false;
      seen.add(s);
      return true;
    });
}

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGODB_URI not set in .env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB\n");

  const db = mongoose.connection.db;

  let tutorsUpdated = 0;
  let usersUpdated = 0;
  let requestsUpdated = 0;

  // 1. Tutor.subjects
  const tutors = await db.collection("tutors").find({}).toArray();
  for (const t of tutors) {
    const raw = Array.isArray(t.subjects) ? t.subjects : [];
    const normalized = normalizeSubjects(raw);
    if (
      normalized.length &&
      JSON.stringify(raw.sort()) !== JSON.stringify([...normalized].sort())
    ) {
      await db
        .collection("tutors")
        .updateOne({ _id: t._id }, { $set: { subjects: normalized } });
      tutorsUpdated++;
    }
  }
  console.log(`Tutors: ${tutorsUpdated} updated`);

  // 2. User.subjectsOfInterest
  const users = await db
    .collection("users")
    .find({ subjectsOfInterest: { $exists: true, $ne: [] } })
    .toArray();
  for (const u of users) {
    const raw = Array.isArray(u.subjectsOfInterest) ? u.subjectsOfInterest : [];
    const normalized = normalizeSubjects(raw);
    if (JSON.stringify(raw.sort()) !== JSON.stringify([...normalized].sort())) {
      await db
        .collection("users")
        .updateOne(
          { _id: u._id },
          { $set: { subjectsOfInterest: normalized } },
        );
      usersUpdated++;
    }
  }
  console.log(`Users (subjectsOfInterest): ${usersUpdated} updated`);

  // 3. TuitionRequest.subject and subjects
  const requests = await db.collection("tuitionrequests").find({}).toArray();
  for (const r of requests) {
    const rawSubjects = Array.isArray(r.subjects)
      ? r.subjects
      : r.subject
        ? [r.subject]
        : [];
    const normalized = normalizeSubjects(rawSubjects);
    const newSubject = normalized[0] || "";
    const needsUpdate =
      r.subject !== newSubject ||
      JSON.stringify([...(r.subjects || [])].sort()) !==
        JSON.stringify([...normalized].sort());
    if (needsUpdate && normalized.length) {
      await db
        .collection("tuitionrequests")
        .updateOne(
          { _id: r._id },
          { $set: { subject: newSubject, subjects: normalized } },
        );
      requestsUpdated++;
    }
  }
  console.log(`TuitionRequests: ${requestsUpdated} updated`);

  console.log("\nDone.");
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
