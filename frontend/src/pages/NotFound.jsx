/**
 * Not Found
 *
 * Rendered for any URL that matches no route. The server answers 404 for these
 * paths, so this is what a visitor sees alongside that status. It is marked
 * noindex because an error page should never appear in search results.
 */

import { Link } from 'react-router-dom';
import Header from '@/components/landing/Header';
import FooterSection from '@/components/landing/FooterSection';
import Seo from '@/components/Seo';
import '@/styles/LandingPage.css';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Seo
        title="Page not found | Best Choice Tutors"
        description="The page you are looking for does not exist or has moved."
        noindex
      />
      <Header />
      <main className="flex-1 bg-slate-50 flex items-center justify-center px-6 py-20">
        <div className="text-center max-w-md">
          <p className="text-5xl font-bold text-[#4FD1C5]">404</p>
          <h1 className="mt-3 text-2xl font-bold text-[#1A365D]">Page not found</h1>
          <p className="mt-2 text-sm text-slate-600">
            The page you are looking for does not exist or has moved.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-flex h-10 items-center rounded-lg bg-[#4FD1C5] px-5 text-sm font-medium text-white hover:bg-[#38B2AC]"
            >
              Back to home
            </Link>
            <Link
              to="/tutors"
              className="inline-flex h-10 items-center rounded-lg border border-slate-200 px-5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Find a tutor
            </Link>
          </div>
        </div>
      </main>
      <FooterSection />
    </div>
  );
}
