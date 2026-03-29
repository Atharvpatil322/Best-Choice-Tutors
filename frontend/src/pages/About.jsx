/**
 * About Us - Public page with generic info about Best Choice Tutors
 */

import { Link } from 'react-router-dom';
import Header from '@/components/landing/Header';
import FooterSection from '@/components/landing/FooterSection';
import {
  BadgeCheck,
  BookOpen,
  CheckCircle,
  Globe,
  GraduationCap,
  MessageSquare,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react';
import '@/styles/LandingPage.css';

export default function About() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0F2442] via-[#112D4E] to-[#1A365D] text-white">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.2),transparent_45%)]"></div>
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#4FD1C5]/20 blur-3xl"></div>
          <div className="absolute -left-28 bottom-0 h-80 w-80 rounded-full bg-[#FF6B6B]/20 blur-3xl"></div>
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-sm font-semibold text-white/90">
              <Sparkles className="h-4 w-4" />
              Built for learners and tutors
            </p>
            <h1 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              About Best Choice Tutors
            </h1>
            <p className="mt-4 text-lg text-white/90 max-w-2xl">
              A trusted tutoring marketplace connecting learners with verified tutors for GCSE, A-Levels, 11+, SATs, and university pathways.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
              <Link
                to="/onboarding"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-[#0F2442] bg-white hover:bg-white/90 transition-colors w-full sm:w-auto min-h-[44px] text-center"
              >
                Book a Tutor
              </Link>
              <Link
                to="/register?role=tutor"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white border border-white/60 hover:bg-white/10 transition-colors w-full sm:w-auto min-h-[44px] text-center"
              >
                Become a Tutor
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                <p className="text-2xl font-bold">100+</p>
                <p className="text-sm text-white/80">Verified tutors</p>
              </div>
              <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                <p className="text-2xl font-bold">20+</p>
                <p className="text-sm text-white/80">Subjects covered</p>
              </div>
              <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                <p className="text-2xl font-bold">24/7</p>
                <p className="text-sm text-white/80">Learner support</p>
              </div>
              <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                <p className="text-2xl font-bold">Safe</p>
                <p className="text-sm text-white/80">Payments & reviews</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10">
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#1A365D]">Our Mission</h2>
              <p className="text-slate-700 leading-relaxed">
                We make expert tutoring accessible, transparent, and outcomes-driven. Our platform helps learners achieve their goals while empowering tutors to build thriving, flexible businesses.
              </p>
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#4FD1C5]/20 flex items-center justify-center">
                      <BadgeCheck className="h-5 w-5 text-[#1A365D]" />
                    </div>
                    <p className="font-semibold text-slate-900">Verified tutors</p>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">Screened profiles with clear qualifications and reviews.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#FF6B6B]/20 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-[#1A365D]" />
                    </div>
                    <p className="font-semibold text-slate-900">Secure payments</p>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">Transparent pricing with safe booking and policies.</p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6">
              <h3 className="text-lg font-semibold text-[#1A365D] mb-4">Why learners choose us</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-[#4FD1C5] mt-0.5" />
                  <p className="text-slate-700">Find the right tutor by level, subject, mode, and budget.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-[#4FD1C5] mt-0.5" />
                  <p className="text-slate-700">Flexible scheduling and lesson formats to fit real life.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-[#4FD1C5] mt-0.5" />
                  <p className="text-slate-700">Ratings, reviews, and support for peace of mind.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-[#4FD1C5] mt-0.5" />
                  <p className="text-slate-700">Personalised learning plans built around your goals.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-[#1A365D]">For Learners</h3>
                </div>
                <p className="mt-3 text-slate-600">
                  Search by subject, price, and teaching mode. Book sessions, message tutors, and track your progress in one place.
                </p>
                <div className="mt-4 grid gap-3">
                  <div className="flex items-start gap-3 text-slate-700">
                    <Users className="h-5 w-5 text-[#4FD1C5] mt-0.5" />
                    <p>Verified tutor profiles with reviews</p>
                  </div>
                  <div className="flex items-start gap-3 text-slate-700">
                    <MessageSquare className="h-5 w-5 text-[#4FD1C5] mt-0.5" />
                    <p>In-platform messaging and support</p>
                  </div>
                  <div className="flex items-start gap-3 text-slate-700">
                    <Shield className="h-5 w-5 text-[#4FD1C5] mt-0.5" />
                    <p>Safe booking with clear policies</p>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                    <GraduationCap className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-[#1A365D]">For Tutors</h3>
                </div>
                <p className="mt-3 text-slate-600">
                  Build your profile, set your schedule, and receive bookings with secure payments and admin support.
                </p>
                <div className="mt-4 grid gap-3">
                  <div className="flex items-start gap-3 text-slate-700">
                    <BadgeCheck className="h-5 w-5 text-[#4FD1C5] mt-0.5" />
                    <p>Verification and quality oversight</p>
                  </div>
                  <div className="flex items-start gap-3 text-slate-700">
                    <Globe className="h-5 w-5 text-[#4FD1C5] mt-0.5" />
                    <p>Online and in-person tutoring options</p>
                  </div>
                  <div className="flex items-start gap-3 text-slate-700">
                    <Shield className="h-5 w-5 text-[#4FD1C5] mt-0.5" />
                    <p>Reliable payouts and protected transactions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-[#1A365D]">Quality-first matching</h3>
              <p className="text-slate-600 mt-2">Subject expertise, teaching style, and learning goals guide every match.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-[#1A365D]">Transparent pricing</h3>
              <p className="text-slate-600 mt-2">Clear rates, flexible scheduling, and no hidden fees.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-[#1A365D]">Trusted support</h3>
              <p className="text-slate-600 mt-2">Fast assistance for bookings, policies, and profile help.</p>
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
          <div className="max-w-6xl mx-auto rounded-3xl border border-slate-200 bg-white p-8 sm:p-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#1A365D]">Get started today</h2>
                <p className="text-slate-600 mt-2">
                  Whether you’re preparing for exams or growing your tutoring business, we’re ready to help.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/onboarding"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-[#4FD1C5] hover:bg-[#38B2AC] transition-colors"
                >
                  Book a Tutor
                </Link>
                <Link
                  to="/register?role=tutor"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-[#1A365D] border-2 border-[#1A365D] hover:bg-[#1A365D] hover:text-white transition-colors"
                >
                  Become a Tutor
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <FooterSection />
    </div>
  );
}
