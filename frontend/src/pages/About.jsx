/**
 * About Us - Public page with generic info about Best Choice Tutors
 */

import { Link } from 'react-router-dom';
import Header from '@/components/landing/Header';
import FooterSection from '@/components/landing/FooterSection';
import { BookOpen, GraduationCap, Shield, Users } from 'lucide-react';
import '@/styles/LandingPage.css';

export default function About() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden flex flex-col">
      <Header />
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1A365D] mb-4">About Best Choice Tutors</h1>
          <p className="text-lg text-slate-600 mb-8">
            Best Choice Tutors is a trusted online marketplace connecting students with qualified, verified tutors for personalized learning experiences.
          </p>

          <section className="space-y-6 mb-10">
            <h2 className="text-xl font-semibold text-[#1A365D]">Our Mission</h2>
            <p className="text-slate-700 leading-relaxed">
              We aim to make quality tutoring accessible to everyone. Whether you need help with GCSEs, A-Levels, university entrance exams, or specific subjects, our platform helps you find the right tutor to achieve your learning goals.
            </p>
          </section>

          <section className="space-y-6 mb-10">
            <h2 className="text-xl font-semibold text-[#1A365D]">How It Works</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">For Learners</h3>
                  <p className="text-sm text-slate-600">
                    Browse tutors by subject, price, and location. Book sessions online or in person. Create tuition requests, message tutors, and leave reviews.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">For Tutors</h3>
                  <p className="text-sm text-slate-600">
                    Create a profile, set your availability, and get verified. Receive bookings, manage sessions, and grow your tutoring business with secure payments.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6 mb-10">
            <h2 className="text-xl font-semibold text-[#1A365D]">Platform Features</h2>
            <ul className="space-y-3 text-slate-700">
              <li className="flex items-start gap-2">
                <Users className="h-5 w-5 text-[#4FD1C5] flex-shrink-0 mt-0.5" />
                <span>Browse verified tutors by subject, level, price range, teaching mode (online or in-person), and location</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="h-5 w-5 text-[#4FD1C5] flex-shrink-0 mt-0.5" />
                <span>Secure booking and payment system with clear cancellation and refund policies</span>
              </li>
              <li className="flex items-start gap-2">
                <BookOpen className="h-5 w-5 text-[#4FD1C5] flex-shrink-0 mt-0.5" />
                <span>Tuition requests allow learners to post their needs and receive offers from qualified tutors</span>
              </li>
              <li className="flex items-start gap-2">
                <GraduationCap className="h-5 w-5 text-[#4FD1C5] flex-shrink-0 mt-0.5" />
                <span>Tutor verification, DBS checks (where applicable), and admin oversight for quality and safety</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#4FD1C5] font-bold">•</span>
                <span>In-platform messaging and support tickets for a smooth experience</span>
              </li>
            </ul>
          </section>

          <section className="space-y-4 rounded-xl bg-slate-50 border border-slate-100 p-6">
            <h2 className="text-xl font-semibold text-[#1A365D]">Get Started</h2>
            <p className="text-slate-700">
              Join thousands of learners and tutors on Best Choice Tutors. Whether you need help with exams or want to share your expertise, we're here to support your journey.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                to="/onboarding"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-white bg-[#4FD1C5] hover:bg-[#38B2AC] transition-colors"
              >
                Book a Tutor
              </Link>
              <Link
                to="/register?role=tutor"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-[#1A365D] border-2 border-[#1A365D] hover:bg-[#1A365D] hover:text-white transition-colors"
              >
                Become a Tutor
              </Link>
            </div>
          </section>
        </div>
      </main>
      <FooterSection />
    </div>
  );
}
