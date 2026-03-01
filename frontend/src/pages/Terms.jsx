/**
 * Terms and Conditions - Public page based on sign-up terms
 */

import Header from '@/components/landing/Header';
import FooterSection from '@/components/landing/FooterSection';
import { Link } from 'react-router-dom';
import '@/styles/LandingPage.css';

export default function Terms() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden flex flex-col">
      <Header />
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6 text-slate-700">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#1A365D]">Terms and Conditions</h1>
            <p className="text-slate-600 mt-1">Last updated: {new Date().toLocaleDateString('en-GB')}</p>
          </div>

          <p>
            Welcome to Best Choice Tutors. By creating an account, you agree to the following terms and conditions.
          </p>

          <section>
            <h2 className="font-semibold text-slate-900 mb-2">1. Eligibility</h2>
            <p>
              You must be at least 13 years of age to register, or have the consent of a parent or legal guardian if under 13. You must provide accurate and complete information when signing up.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900 mb-2">2. Account and conduct</h2>
            <p>
              You are responsible for keeping your password secure and for all activity under your account. You agree to use the platform only for lawful purposes and to treat other users (learners, tutors, and staff) with respect. Harassment, fraud, or misuse of the service is prohibited.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900 mb-2">3. Tutoring and bookings</h2>
            <p>
              Sessions are subject to our booking and cancellation policies. Payments are processed in accordance with our payment terms. As a tutor, you agree to provide accurate qualifications and availability and to conduct sessions professionally.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900 mb-2">4. Privacy and data</h2>
            <p>
              Your use of Best Choice Tutors is also governed by our{' '}
              <Link to="/privacy" className="text-[#4FD1C5] hover:text-[#38B2AC] font-medium underline underline-offset-2">
                Privacy Policy
              </Link>
              . We collect and use data as described there to provide the service, process payments, and improve the platform.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900 mb-2">5. Changes and termination</h2>
            <p>
              We may update these terms from time to time. Continued use of the service after changes constitutes acceptance. We may suspend or terminate accounts that breach these terms.
            </p>
          </section>

        </div>
      </main>
      <FooterSection />
    </div>
  );
}
