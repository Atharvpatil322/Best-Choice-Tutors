/**
 * PSEO Landing
 *
 * Renders a generated landing page from its database record, or the not-found
 * screen when the path matches none.
 *
 * These paths previously had no route of their own, so React fell through to
 * the catch-all while the server answered 200. Any content shown was the
 * homepage, which meant every generated URL was duplicate content - the exact
 * thing that gets a set of programmatic pages devalued.
 */

import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Header from '@/components/landing/Header';
import FooterSection from '@/components/landing/FooterSection';
import FaqSection from '@/components/landing/FaqSection';
import Seo from '@/components/Seo';
import NotFound from './NotFound';
import { getPseoPage } from '@/services/seoToolsService';
import { tutorSearchPath } from '@/constants/subjects';
import '@/styles/LandingPage.css';

export default function PseoLanding() {
  const { pathname } = useLocation();
  const [page, setPage] = useState(undefined); // undefined = loading
  useEffect(() => {
    let cancelled = false;
    setPage(undefined);
    getPseoPage(pathname)
      .then((result) => !cancelled && setPage(result || null))
      .catch(() => !cancelled && setPage(null));
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (page === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#4FD1C5]" />
      </div>
    );
  }
  if (page === null) return <NotFound />;

  const browseHref = page.subject ? tutorSearchPath(page.subject) : '/tutors';

  return (
    <div className="min-h-screen flex flex-col">
      <Seo title={page.title} description={page.description} />
      <Header />
      <main className="flex-1 bg-slate-50">
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1A365D] leading-tight">
            {page.heading || page.title}
          </h1>
          {page.intro && (
            <p className="mt-4 text-base text-slate-600 leading-relaxed">{page.intro}</p>
          )}
          {page.description && !page.intro && (
            <p className="mt-4 text-base text-slate-600 leading-relaxed">{page.description}</p>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to={browseHref}
              className="inline-flex h-11 items-center rounded-lg bg-[#4FD1C5] px-6 text-sm font-medium text-white hover:bg-[#38B2AC]"
            >
              {page.subject ? `Browse ${page.subject} tutors` : 'Browse tutors'}
            </Link>
            <Link
              to="/how-it-works"
              className="inline-flex h-11 items-center rounded-lg border border-slate-200 bg-white px-6 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              How it works
            </Link>
          </div>

          {(page.subject || page.location) && (
            <dl className="mt-10 grid gap-4 sm:grid-cols-2">
              {page.subject && (
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <dt className="text-xs uppercase tracking-wide text-slate-400">Subject</dt>
                  <dd className="mt-1 text-sm font-medium text-[#1A365D]">{page.subject}</dd>
                </div>
              )}
              {page.location && (
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <dt className="text-xs uppercase tracking-wide text-slate-400">Location</dt>
                  <dd className="mt-1 text-sm font-medium text-[#1A365D]">{page.location}</dd>
                </div>
              )}
            </dl>
          )}
        </section>

        {/* Subject FAQs when the page has a subject, general ones otherwise. */}
        <FaqSection subject={page.subject || undefined} />
      </main>
      <FooterSection />
    </div>
  );
}
