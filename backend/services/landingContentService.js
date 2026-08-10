import Benefit from "../models/Benefit.js";
import PopularSearch from "../models/PopularSearch.js";

const DEFAULT_POPULAR_SEARCHES = [
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

const DEFAULT_BENEFITS = [
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

export async function ensureDefaultBenefits() {
  const existingCount = await Benefit.estimatedDocumentCount();
  if (existingCount > 0) return;
  await Benefit.insertMany(DEFAULT_BENEFITS);
}

export async function ensureDefaultPopularSearches() {
  const existingCount = await PopularSearch.estimatedDocumentCount();
  if (existingCount > 0) return;
  await PopularSearch.insertMany(DEFAULT_POPULAR_SEARCHES);
}
