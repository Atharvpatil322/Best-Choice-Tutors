/**
 * Platform Policy
 * Single page showing policy for both learners and tutors. Accessible from learner and tutor sidebars.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, GraduationCap } from 'lucide-react';

function Policy() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1A365D]">Platform Policy</h1>
        <p className="text-slate-600 mt-1">
          Best Choice Tutors policies for learners and tutors. Please read the section that applies to you.
        </p>
      </div>

      {/* For Learners */}
      <Card className="border-slate-200 rounded-2xl overflow-hidden">
        <CardHeader className="bg-blue-50/50 border-b border-slate-100">
          <CardTitle className="flex items-center gap-2 text-lg text-[#1A365D]">
            <BookOpen className="h-5 w-5 text-blue-600" />
            For Learners
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 space-y-4 text-sm text-slate-700">
          <section>
            <h3 className="font-semibold text-slate-900 mb-2">Eligibility & account</h3>
            <p>
              You must be at least 18 years of age to register, or have parental/guardian consent if under 18. You must provide accurate information when signing up and keep your account secure.
            </p>
          </section>
          <section>
            <h3 className="font-semibold text-slate-900 mb-2">Bookings & payments</h3>
            <p>
              Sessions are subject to our booking and cancellation policies. Payment is required to confirm a booking. Refunds and cancellations are handled as per the terms shown at the time of booking.
            </p>
          </section>
          <section>
            <h3 className="font-semibold text-slate-900 mb-2">Conduct</h3>
            <p>
              You agree to use the platform for lawful purposes only and to treat tutors and staff with respect. Harassment, fraud, or misuse of the service is prohibited and may result in account suspension.
            </p>
          </section>
          <section>
            <h3 className="font-semibold text-slate-900 mb-2">Reviews & disputes</h3>
            <p>
              You may leave reviews for completed sessions. Reviews must be honest and not abusive. Disputes should be raised through the platform; we will investigate and resolve in line with our dispute policy.
            </p>
          </section>
          <section>
            <h3 className="font-semibold text-slate-900 mb-2">Privacy</h3>
            <p>
              Your use of the platform is also governed by our Privacy Policy. We collect and use data to provide the service, process payments, and improve the platform.
            </p>
          </section>
        </CardContent>
      </Card>

      {/* For Tutors */}
      <Card className="border-slate-200 rounded-2xl overflow-hidden">
        <CardHeader className="bg-emerald-50/50 border-b border-slate-100">
          <CardTitle className="flex items-center gap-2 text-lg text-[#1A365D]">
            <GraduationCap className="h-5 w-5 text-emerald-600" />
            For Tutors
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 space-y-4 text-sm text-slate-700">
          <section>
            <h3 className="font-semibold text-slate-900 mb-2">Verification & profile</h3>
            <p>
              You must complete your tutor profile with accurate qualifications and upload required documents for verification. Admin approval is required before you are marked as verified. The verified badge is displayed on your public profile once approved.
            </p>
          </section>
          <section>
            <h3 className="font-semibold text-slate-900 mb-2">Availability & sessions</h3>
            <p>
              You must keep your availability up to date and conduct sessions professionally at the scheduled times. Cancellations and no-shows are subject to our tutor conduct policy and may affect your standing.
            </p>
          </section>
          <section>
            <h3 className="font-semibold text-slate-900 mb-2">Earnings & payments</h3>
            <p>
              Earnings from completed sessions are held and released according to our wallet policy. Platform fees may apply as set in the configuration. You are responsible for any tax obligations in your jurisdiction.
            </p>
          </section>
          <section>
            <h3 className="font-semibold text-slate-900 mb-2">Conduct & reviews</h3>
            <p>
              You agree to provide tutoring in a professional manner and not to engage in harassment, fraud, or misuse. Reviews from learners may be displayed on your profile. You may report inappropriate reviews through the platform.
            </p>
          </section>
          <section>
            <h3 className="font-semibold text-slate-900 mb-2">DBS & safeguarding</h3>
            <p>
              Where applicable, you may be required to submit DBS (or equivalent) documentation. Approval of such documents is separate from qualification verification and may be required for certain types of tuition.
            </p>
          </section>
          <section>
            <h3 className="font-semibold text-slate-900 mb-2">Privacy & data</h3>
            <p>
              Your use of the platform is also governed by our Privacy Policy. We use your data to provide the service, process payments, and display your profile to learners.
            </p>
          </section>
        </CardContent>
      </Card>

      <p className="text-xs text-slate-500">
        These policies may be updated from time to time. Continued use of the platform after changes constitutes acceptance. For full terms and conditions, see the consent and terms presented at registration and booking.
      </p>
    </div>
  );
}

export default Policy;
