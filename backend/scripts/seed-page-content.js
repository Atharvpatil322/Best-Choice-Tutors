/**
 * Seed page content
 *
 * Copies the text currently rendered by the public page components into the
 * database, so the Pages editor opens with the real wording already filled in.
 * Every string below was read from the component that renders it — nothing here
 * is paraphrased or invented, so seeding cannot change what a visitor sees.
 *
 * Source of each section:
 *   home/hero        components/landing/HeroSection.jsx
 *   home/welcome     components/landing/WelcomeSection.jsx
 *   home/trust       components/landing/TrustSection.jsx
 *   home/reach       components/landing/ReachSection.jsx
 *   home/commitment  components/landing/CommitmentSection.jsx
 *   home/reviews     components/landing/ReviewSection.jsx
 *   home/book        components/landing/BookSection.jsx
 *   subjects/tiles   components/landing/SubjectsSections.jsx
 *   about/*          pages/About.jsx
 *   how-it-works/*   components/landing/HowItWorksSection.jsx
 *
 * Safe to re-run: existing records are left alone by default, so admin edits are
 * never overwritten. Pass --force to reset every section to the original copy.
 *
 * Run from the backend directory:
 *   node scripts/seed-page-content.js
 *   node scripts/seed-page-content.js --force
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

const CONTENT = [
  // ------------------------------------------------------------------ home
  {
    pageKey: 'home',
    sectionKey: 'hero',
    heading: 'Connecting You With Trusted Tutors – Online & In-Person',
    subheading:
      'Book qualified, verified tutors for GCSE, A-Levels, 11+ & SATs, University & more. Safe payments. Flexible scheduling. Trusted by parents and students.',
  },
  {
    pageKey: 'home',
    sectionKey: 'welcome',
    heading: 'Get Started in 3 Simple Steps',
    items: [
      {
        title: '1. Search & Compare',
        description:
          'Browse verified tutors by subject, location, price, and availability. Read reviews from real students.',
        order: 0,
      },
      {
        title: '2. Book Securely',
        description:
          'Select your preferred time slot and pay securely. Your payment is held safely until after the lesson.',
        order: 1,
      },
      {
        title: '3. Learn & Grow',
        description:
          'Attend your lesson online or in-person, track your progress, and leave a review to help others.',
        order: 2,
      },
    ],
  },
  {
    pageKey: 'home',
    sectionKey: 'reach',
    heading: 'Global Reach, Local Expertise',
    subheading: 'Find Trusted Tutors Worldwide',
    body: 'Best Choice Tutors is proud to serve students and connect them with qualified educators across various countries. Our global network ensures that quality education is accessible no matter where you are.',
    ctaLabel: 'Browse Tutors - Explore By Location',
    ctaHref: '/register?role=learner&from=explore-location',
    items: [
      { title: '• Connect Globally', order: 0 },
      { title: '• Learn Anytime', order: 1 },
      { title: '• Achieve More', order: 2 },
    ],
  },
  {
    pageKey: 'home',
    sectionKey: 'book',
    heading: 'Start your journey with Best Choice Tutors',
    subheading:
      "Whether you're looking for expert academic support or want to inspire the next generation, we're here to help.",
    items: [
      { title: 'Book a Tutor', linkUrl: '/onboarding', order: 0 },
      { title: 'Become a Tutor', linkUrl: '/register?role=tutor', order: 1 },
    ],
  },

  // -------------------------------------------------------------- subjects
  {
    pageKey: 'subjects',
    sectionKey: 'tiles',
    heading: 'Educational Levels',
    items: [
      { title: 'GCSE', imageUrl: '/images/gcse.png', imageAlt: 'GCSE', order: 0 },
      { title: 'A-Levels', imageUrl: '/images/A-Levels.png', imageAlt: 'A-Levels', order: 1 },
      { title: 'University', imageUrl: '/images/University.png', imageAlt: 'University', order: 2 },
      {
        title: '11+ & SATs',
        imageUrl: '/images/All Languages.png',
        imageAlt: '11+ & SATs',
        order: 3,
      },
    ],
  },

  // ----------------------------------------------------------------- about
  {
    pageKey: 'about',
    sectionKey: 'hero',
    heading: 'About Best Choice Tutors',
    subheading:
      'A trusted tutoring marketplace connecting learners with verified tutors for GCSE, A-Levels, 11+, SATs, and university pathways.',
  },
  {
    pageKey: 'about',
    sectionKey: 'mission',
    heading: 'Our Mission',
    body: 'We make expert tutoring accessible, transparent, and outcomes-driven. Our platform helps learners achieve their goals while empowering tutors to build thriving, flexible businesses.',
  },
  {
    pageKey: 'about',
    sectionKey: 'values',
    heading: 'Why learners choose us',
    items: [
      { title: 'Find the right tutor by level, subject, mode, and budget.', order: 0 },
      { title: 'Flexible scheduling and lesson formats to fit real life.', order: 1 },
      { title: 'Ratings, reviews, and support for peace of mind.', order: 2 },
      { title: 'Personalised learning plans built around your goals.', order: 3 },
    ],
  },
  {
    pageKey: 'about',
    sectionKey: 'cta',
    heading: 'Get started today',
    subheading:
      'Whether you’re preparing for exams or growing your tutoring business, we’re ready to help.',
    items: [
      { title: 'Book a Tutor', linkUrl: '/onboarding', order: 0 },
      { title: 'Become a Tutor', linkUrl: '/register?role=tutor', order: 1 },
    ],
  },

  // ---------------------------------------------------------- how it works
  {
    pageKey: 'how-it-works',
    sectionKey: 'intro',
    heading: 'How it works',
    subheading: 'From sign-up to session — see how learners and tutors use Best Choice Tutors.',
  },
  {
    pageKey: 'how-it-works',
    sectionKey: 'steps',
    heading: 'For learners',
    items: [
      {
        title: 'Sign up',
        description: 'Create a free account as a learner or parent. Choose your role and add basic details.',
        order: 0,
      },
      {
        title: 'Browse tutors',
        description: 'Search by subject, location, price and mode. View profiles, reviews and availability.',
        order: 1,
      },
      {
        title: 'Book a session',
        description: 'Pick a time slot that works for you. Confirm booking and complete any age-eligibility steps.',
        order: 2,
      },
      {
        title: 'Pay securely',
        description: 'Payment is held safely in escrow and only released to the tutor after your lesson.',
        order: 3,
      },
      {
        title: 'Attend your lesson',
        description: 'Meet online or in-person. Use in-app chat to coordinate and ask questions.',
        order: 4,
      },
      {
        title: 'Review & rebook',
        description: 'Leave a review to help others. Book the same tutor again or try someone new.',
        order: 5,
      },
    ],
  },
  {
    pageKey: 'how-it-works',
    sectionKey: 'tutor-steps',
    heading: 'For tutors',
    items: [
      {
        title: 'Sign up as a tutor',
        description: 'Create an account and choose \u201CBecome a tutor\u201D to start your teaching journey.',
        order: 0,
      },
      {
        title: 'Create your profile',
        description:
          'Add subjects, qualifications, hourly rate, teaching mode (online/in-person) and a short bio.',
        order: 1,
      },
      {
        title: 'Set your availability',
        description: 'Define your weekly schedule and timezone. Add exceptions for holidays or time off.',
        order: 2,
      },
      {
        title: 'Get verified',
        description:
          'Submit qualification documents and, for in-person tutoring, DBS check. We verify and approve.',
        order: 3,
      },
      {
        title: 'Receive bookings',
        description:
          'Learners find you and book sessions. You get notified and can manage bookings in your dashboard.',
        order: 4,
      },
      {
        title: 'Deliver sessions & get paid',
        description:
          'Teach the lesson, then payment is released to you. Best Choice Tutors charges a 25% platform commission on each session; you keep the rest. Track earnings and payouts in your wallet.',
        order: 5,
      },
    ],
  },
];

/**
 * Insert the default copy, leaving existing records untouched unless --force.
 */
async function run() {
  const force = process.argv.includes('--force');
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const { default: PageContent } = await import('../models/PageContent.js');

  // Remove records for sections that are no longer in the registry, so the
  // editor never shows content nothing on the site renders.
  const { PAGE_SECTIONS } = await import('../constants/pageSections.js');
  const valid = new Set(
    PAGE_SECTIONS.flatMap((page) =>
      page.sections.map((section) => `${page.pageKey}:${section.sectionKey}`),
    ),
  );
  const stale = await PageContent.find().lean();
  let removed = 0;
  for (const doc of stale) {
    if (!valid.has(`${doc.pageKey}:${doc.sectionKey}`)) {
      await PageContent.deleteOne({ _id: doc._id });
      removed += 1;
    }
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const entry of CONTENT) {
    const existing = await PageContent.findOne({
      pageKey: entry.pageKey,
      sectionKey: entry.sectionKey,
    });

    if (existing && !force) {
      skipped += 1;
      continue;
    }

    if (existing) {
      existing.set(entry);
      await existing.save();
      updated += 1;
    } else {
      await PageContent.create(entry);
      created += 1;
    }
  }

  console.log(
    `Created ${created}, updated ${updated}, skipped ${skipped} existing, removed ${removed} stale.`,
  );
  if (skipped > 0 && !force) {
    console.log('Existing sections were left as they are. Re-run with --force to reset them.');
  }
  await mongoose.disconnect();
  console.log('Done.');
}

run().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
