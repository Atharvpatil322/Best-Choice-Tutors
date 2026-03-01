/**
 * Tutor Dashboard
 * Welcome banner, quick links, quick actions. No API calls for bookings/wallet —
 * each tab fetches its own data when visited.
 */

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getStoredUser } from '@/services/authService';
import welcome from '../../images/welcomeFamily.jpeg';
import {
  BookOpen,
  Banknote,
  Calendar,
  CalendarClock,
  ChevronRight,
  User,
  FileText,
} from 'lucide-react';

function TutorDashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const quickLinks = [
    { label: 'Bookings', icon: <BookOpen className="h-5 w-5 text-blue-600" />, bg: 'bg-blue-50', path: '/tutor/bookings' },
    { label: 'Wallet & Earnings', icon: <Banknote className="h-5 w-5 text-purple-600" />, bg: 'bg-purple-50', path: '/tutor/earnings' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 pb-8 sm:pb-12 min-w-0">
      {/* 1. WELCOME BANNER — increased height */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-[24px] bg-[#F4F9FF] border border-blue-100 min-h-[180px] sm:min-h-[200px] flex items-center px-4 sm:px-6 lg:px-12 py-8 sm:py-10">
        <div className="absolute right-[5%] top-1/2 -translate-y-1/2 w-[220px] h-[220px] sm:w-[300px] sm:h-[300px] lg:w-[380px] lg:h-[380px] bg-[radial-gradient(circle,_rgba(191,219,254,0.6)_0%,_rgba(244,249,255,0)_70%)] pointer-events-none" />
        <div className="z-10 max-w-xl min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#1A365D] mb-2 sm:mb-3">
            Welcome, {user?.name || 'Tutor'} 👋
          </h1>
          <p className="text-slate-600 font-medium text-base sm:text-lg lg:text-xl leading-relaxed">
            Manage your sessions and grow your tutoring business.
          </p>
        </div>
        <div className="absolute right-0 top-0 h-full w-[38%] sm:w-[42%] pointer-events-none hidden sm:block">
          <img
            src={welcome}
            alt="Tutoring"
            className="h-full w-[85%] object-cover object-center"
            style={{
              maskImage: 'radial-gradient(circle at center, black 40%, transparent 75%)',
              WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 75%)',
            }}
          />
        </div>
      </div>

      {/* 2. QUICK LINKS — navigate to dedicated tabs (no preload) */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 px-0 sm:px-1">
          Your activity
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
        {/* 3. UPCOMING SESSIONS — CTA to Bookings (data loads on that tab) */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6 min-w-0">
          <div className="flex items-center justify-between gap-2 px-0 sm:px-2 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-[#1A365D] truncate">Upcoming Sessions</h2>
            <button
              type="button"
              onClick={() => navigate('/tutor/bookings')}
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
              onClick={() => navigate('/tutor/bookings')}
            >
              Go to Bookings
            </Button>
          </Card>
        </div>


        {/* 4. QUICK ACTIONS */}
        <div className="space-y-4 sm:space-y-6 min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-[#1A365D] px-0 sm:px-2">Quick Action</h2>
          <Card className="border-slate-100 rounded-2xl sm:rounded-[24px] shadow-sm min-w-0">
            <CardContent className="p-4 sm:p-6 space-y-3">
              <Button
                onClick={() => navigate('/tutor/profile')}
                className="w-full h-12 sm:h-14 bg-[#1A365D] hover:bg-[#1A365D]/90 text-white rounded-xl font-bold justify-start px-4 sm:px-6 gap-3 sm:gap-4 text-sm sm:text-base"
              >
                <User size={20} className="shrink-0" /> <span className="truncate">My Profile</span>
              </Button>
              <Button
                onClick={() => navigate('/tutor/earnings')}
                variant="outline"
                className="w-full h-12 sm:h-14 border-slate-100 text-[#1A365D] hover:bg-slate-50 rounded-xl font-medium justify-start px-4 sm:px-6 gap-3 sm:gap-4 text-sm sm:text-base"
              >
                <Banknote size={20} className="shrink-0" /> <span className="truncate">Wallet & Earnings</span>
              </Button>
              {/* <Button
                onClick={() => navigate('/tutor/bookings')}
                variant="outline"
                className="w-full h-12 sm:h-14 border-slate-100 text-[#1A365D] hover:bg-slate-50 rounded-xl font-medium justify-start px-4 sm:px-6 gap-3 sm:gap-4 text-sm sm:text-base"
              >
                <Calendar size={20} className="shrink-0" /> <span className="truncate">Bookings</span>
              </Button>
              <Button
                onClick={() => navigate('/tutor/earnings')}
                variant="outline"
                className="w-full h-12 sm:h-14 border-slate-100 text-[#1A365D] hover:bg-slate-50 rounded-xl font-medium justify-start px-4 sm:px-6 gap-3 sm:gap-4 text-sm sm:text-base"
              >
                <Banknote size={20} className="shrink-0" /> <span className="truncate">Earnings</span>
              </Button> */}
              <Button
                onClick={() => navigate('/tutor/availability')}
                variant="outline"
                className="w-full h-12 sm:h-14 border-slate-100 text-[#1A365D] hover:bg-slate-50 rounded-xl font-medium justify-start px-4 sm:px-6 gap-3 sm:gap-4 text-sm sm:text-base"
              >
                <CalendarClock size={20} className="shrink-0" /> <span className="truncate">Manage Availability</span>
              </Button>
              {/* <Button
                onClick={() => navigate('/tutor/verification-documents')}
                variant="outline"
                className="w-full h-12 sm:h-14 border-slate-100 text-[#1A365D] hover:bg-slate-50 rounded-xl font-medium justify-start px-4 sm:px-6 gap-3 sm:gap-4 text-sm sm:text-base"
              >
                <GraduationCap size={20} className="shrink-0" /> <span className="truncate">Verification Documents</span>
              </Button> */}
              <Button
                onClick={() => navigate('/tutor/tuition-requests')}
                variant="outline"
                className="w-full h-12 sm:h-14 border-slate-100 text-[#1A365D] hover:bg-slate-50 rounded-xl font-medium justify-start px-4 sm:px-6 gap-3 sm:gap-4 text-sm sm:text-base"
              >
                <FileText size={20} className="shrink-0" /> <span className="truncate">Browse tuition requests</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default TutorDashboard;
