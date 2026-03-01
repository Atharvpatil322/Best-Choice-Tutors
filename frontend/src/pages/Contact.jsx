/**
 * Contact - Public page with support and contact info
 */

import { Link } from 'react-router-dom';
import Header from '@/components/landing/Header';
import FooterSection from '@/components/landing/FooterSection';
import { Mail, MessageCircle } from 'lucide-react';
import '@/styles/LandingPage.css';

export default function Contact() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden flex flex-col">
      <Header />
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1A365D] mb-4">Contact Us</h1>
          <p className="text-slate-600 mb-8">
            Have a question or need help? We're here to support you.
          </p>
          <div className="space-y-6 rounded-xl bg-slate-50 border border-slate-100 p-8">
            <div className="flex flex-col items-center gap-3">
              <Mail className="h-10 w-10 text-[#4FD1C5]" />
              <h2 className="font-semibold text-slate-900">Email Support</h2>
              <a
                href="mailto:support@bestchoicetutors.com"
                className="text-[#4FD1C5] hover:text-[#38B2AC] font-medium"
              >
                support@bestchoicetutors.com
              </a>
            </div>
            <div className="border-t border-slate-200 pt-6">
              <p className="text-slate-600 text-sm mb-4">
                Registered users can also submit support tickets from their dashboard for faster assistance.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-white bg-[#4FD1C5] hover:bg-[#38B2AC] transition-colors"
              >
                <MessageCircle size={18} />
                Sign in to use Support
              </Link>
            </div>
          </div>
        </div>
      </main>
      <FooterSection />
    </div>
  );
}
