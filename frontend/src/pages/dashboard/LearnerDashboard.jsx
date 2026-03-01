/**
 * Learner Dashboard
 * Welcome banner, quick actions. No API calls for bookings/reviews/requests —
 * each tab fetches its own data when visited.
 */

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getStoredUser } from '@/services/authService';
import welcome from '../../images/welcomeFamily.jpeg';
import {
  BookOpen,
  FileText,
  Star,
  ChevronRight,
  Calendar,
  GraduationCap,
} from 'lucide-react';
import { switchToTutor } from '../../services/authService';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function LearnerDashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [switchingToTutor, setSwitchingToTutor] = useState(false);
  const [becomeTutorConsentOpen, setBecomeTutorConsentOpen] = useState(false);
  const [becomeTutorTermsAccepted, setBecomeTutorTermsAccepted] = useState(false);

  const handleBecomeTutor = async () => {
    setSwitchingToTutor(true);
    try {
      await switchToTutor();
      setBecomeTutorConsentOpen(false);
      setBecomeTutorTermsAccepted(false);
      toast.success('You are now a tutor. Complete your profile to start teaching.');
      navigate('/tutor', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Could not switch to tutor. Please try again.');
    } finally {
      setSwitchingToTutor(false);
    }
  };

  const quickLinks = [
    { label: 'My Bookings', icon: <BookOpen className="h-5 w-5 text-blue-600" />, bg: 'bg-blue-50', path: '/dashboard/bookings' },
    { label: 'Reviews', icon: <Star className="h-5 w-5 text-amber-600" />, bg: 'bg-amber-50', path: '/dashboard/reviews' },
    { label: 'Tuition Requests', icon: <FileText className="h-5 w-5 text-slate-600" />, bg: 'bg-slate-100', path: '/dashboard/tuition-requests' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 pb-8 sm:pb-12 min-w-0">
      {/* 1. WELCOME BANNER – increased height */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-[24px] bg-[#F4F9FF] border border-blue-100 min-h-[180px] sm:min-h-[200px] flex items-center px-4 sm:px-6 lg:px-12 py-8 sm:py-10">
        <div className="absolute right-[5%] top-1/2 -translate-y-1/2 w-[220px] h-[220px] sm:w-[300px] sm:h-[300px] lg:w-[380px] lg:h-[380px] bg-[radial-gradient(circle,_rgba(191,219,254,0.6)_0%,_rgba(244,249,255,0)_70%)] pointer-events-none" />
        <div className="z-10 max-w-xl min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#1A365D] mb-2 sm:mb-3">
            Welcome, {user?.name || 'Guest'} 👋
          </h1>
          <p className="text-slate-600 font-medium text-base sm:text-lg lg:text-xl leading-relaxed">
            Let&apos;s get started with your learning journey today.
          </p>
        </div>
        <div className="absolute right-0 top-0 h-full w-[38%] sm:w-[42%] pointer-events-none hidden sm:block">
          <img
            src={welcome}
            alt="Learning"
            className="h-full w-[85%] object-cover object-center"
            style={{
              maskImage: 'radial-gradient(circle at center, black 40%, transparent 75%)',
              WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 75%)',
            }}
          />
        </div>
      </div>

      {/* 2. QUICK LINKS – navigate to dedicated tabs (no preload) */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 px-0 sm:px-1">
          Your activity
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {quickLinks.map((link) => (
            <Card
              key={link.label}
              className="border-slate-200 shadow-sm rounded-xl overflow-hidden min-w-0 cursor-pointer hover:border-[#1A365D]/30 transition-colors"
              onClick={() => navigate(link.path)}
            >
              <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-3">
                <div className={`p-2.5 rounded-xl shrink-0 ${link.bg}`}>
                  {link.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#1A365D]">{link.label}</p>
                  <p className="text-xs text-slate-500">View details</p>
                </div>
                <ChevronRight size={18} className="text-slate-400 shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 min-w-0">
        {/* 3. UPCOMING SESSIONS – CTA to My Bookings (data loads on that tab) */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6 min-w-0">
          <div className="flex items-center justify-between gap-2 px-0 sm:px-2 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-[#1A365D] truncate">Upcoming Sessions</h2>
            <button
              type="button"
              onClick={() => navigate('/dashboard/bookings')}
              className="flex items-center text-sm font-semibold text-slate-500 hover:text-[#1A365D] shrink-0"
            >
              View All <ChevronRight size={16} />
            </button>
          </div>
          <Card className="border-slate-100 rounded-2xl sm:rounded-[24px] p-6 sm:p-8 border-dashed flex flex-col items-center justify-center text-center min-w-0">
            <div className="bg-slate-50 p-4 rounded-full mb-4">
              <Calendar className="text-slate-300" size={32} />
            </div>
            <p className="text-slate-500 font-medium text-sm sm:text-base">View your bookings and sessions</p>
            <Button
              variant="outline"
              className="mt-4 rounded-xl border-slate-200 text-[#1A365D] w-full sm:w-auto"
              onClick={() => navigate('/dashboard/bookings')}
            >
              Go to My Bookings
            </Button>
          </Card>
        </div>

        {/* 4. QUICK ACTIONS */}
        <div className="space-y-4 sm:space-y-6 min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-[#1A365D] px-0 sm:px-2">Quick Action</h2>
          <Card className="border-slate-100 rounded-2xl sm:rounded-[24px] shadow-sm min-w-0">
            <CardContent className="p-4 sm:p-6 space-y-3">
              <Button
                onClick={() => navigate('/dashboard/browse-tutors')}
                className="w-full h-12 sm:h-14 bg-[#1A365D] hover:bg-[#1A365D]/90 text-white rounded-xl font-bold justify-start px-4 sm:px-6 gap-3 sm:gap-4 text-sm sm:text-base"
              >
                <Calendar size={20} className="shrink-0" /> <span className="truncate">Book a Session</span>
              </Button>
              <Button
                onClick={() => navigate('/dashboard/reviews')}
                variant="outline"
                className="w-full h-12 sm:h-14 border-slate-100 text-[#1A365D] hover:bg-slate-50 rounded-xl font-medium justify-start px-4 sm:px-6 gap-3 sm:gap-4 text-sm sm:text-base"
              >
                <Star size={20} className="shrink-0" /> <span className="truncate">Rate Recent Sessions</span>
              </Button>
              <Button
                onClick={() => setBecomeTutorConsentOpen(true)}
                disabled={switchingToTutor}
                variant="outline"
                className="w-full h-12 sm:h-14 border-teal-200 text-teal-700 hover:bg-teal-50 rounded-xl font-medium justify-start px-4 sm:px-6 gap-3 sm:gap-4 text-sm sm:text-base"
              >
                <GraduationCap size={20} className="shrink-0" /> <span className="truncate">{switchingToTutor ? 'Switching…' : 'Become a Tutor'}</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Become a Tutor — consent dialog (same pattern as booking consent) */}
      <AlertDialog
        open={becomeTutorConsentOpen}
        onOpenChange={(open) => {
          setBecomeTutorConsentOpen(open);
          if (!open) setBecomeTutorTermsAccepted(false);
        }}
      >
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Become a Tutor</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-left text-sm text-muted-foreground">
                <p>
                  Switching to tutor will <strong>change your role</strong> from learner to tutor on Best Choice Tutors.
                </p>
                <p>
                  Your learner profile and booking history will remain, but your default view and dashboard will be the tutor dashboard. You can switch back to learner later if your account supports both roles.
                </p>
                <p>
                  By becoming a tutor you agree to our tutor terms of service, including providing accurate qualifications and availability, and conducting sessions professionally.
                </p>
                <p>
                  By checking the box below, you confirm that you understand this role change and accept the terms and conditions for tutors.
                </p>
                <label className="flex items-start gap-3 cursor-pointer mt-4 p-3 rounded-lg border border-input bg-muted/30 hover:bg-muted/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={becomeTutorTermsAccepted}
                    onChange={(e) => setBecomeTutorTermsAccepted(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-input"
                    aria-describedby="become-tutor-consent-label"
                  />
                  <span id="become-tutor-consent-label" className="text-sm text-foreground">
                    I understand that my role will change from learner to tutor and I accept the terms and conditions for tutors.
                  </span>
                </label>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              onClick={handleBecomeTutor}
              disabled={!becomeTutorTermsAccepted || switchingToTutor}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {switchingToTutor ? 'Switching…' : 'Accept & Become Tutor'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default LearnerDashboard;