/**
 * Tutor Dashboard
 * Welcome banner, real stats from bookings + wallet, upcoming sessions, quick actions.
 */

import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getStoredUser } from '@/services/authService';
import { getTutorBookings } from '@/services/tutorBookingsService';
import { getWallet } from '@/services/tutorWalletService';
import { getTutorProfile } from '@/services/tutorProfileService';
import welcome from '../../images/welcomeFamily.jpeg';
import {
  BookOpen,
  Clock,
  Banknote,
  Calendar,
  CalendarClock,
  ChevronRight,
  User,
  GraduationCap,
  FileText,
  Award,
} from 'lucide-react';

function formatEarnings(pence) {
  if (pence == null || !Number.isFinite(pence)) return '—';
  return `£${(pence / 100).toFixed(2)}`;
}

function TutorDashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [bookings, setBookings] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [badges, setBadges] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const [bookingsRes, walletRes, profileRes] = await Promise.all([
          getTutorBookings().catch(() => ({ bookings: [] })),
          getWallet().catch(() => null),
          getTutorProfile().catch(() => ({ tutor: null })),
        ]);
        setBookings(bookingsRes.bookings || []);
        setWallet(walletRes);
        const t = profileRes?.tutor;
        const list = [];
        if (t?.isVerified) list.push('Verified');
        if (t?.isDbsVerified) list.push('DBS Verified');
        setBadges(list);
      } catch {
        setBookings([]);
        setWallet(null);
        setBadges([]);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const totalBookings = bookings.length;
  const completedSessions = bookings.filter((b) => b.status === 'COMPLETED').length;
  const today = new Date().toISOString().slice(0, 10);

  const totalEarnings = wallet?.totalEarnings ?? 0;
  const stats = [
    {
      label: 'Total Bookings',
      value: statsLoading ? '—' : String(totalBookings),
      icon: <BookOpen className="h-5 w-5 text-blue-600" />,
      bg: 'bg-blue-50',
    },
    {
      label: 'Completed Sessions',
      value: statsLoading ? '—' : String(completedSessions),
      icon: <Clock className="h-5 w-5 text-emerald-600" />,
      bg: 'bg-emerald-50',
    },
    {
      label: 'Total Earnings',
      value: statsLoading ? '—' : formatEarnings(totalEarnings),
      icon: <Banknote className="h-5 w-5 text-purple-600" />,
      bg: 'bg-purple-50',
    },
    {
      label: 'Badges',
      value: statsLoading ? '—' : String(badges.length),
      icon: <Award className="h-5 w-5 text-amber-600" />,
      bg: 'bg-amber-50',
      badges,
    },
  ];

  const upcomingBookings = bookings
    .filter((b) => b.status === 'PAID' && b.date >= today)
    .slice(0, 3);

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

      {/* 2. STATS GRID — real data */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 px-0 sm:px-1">
          Your activity
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-slate-200 shadow-sm rounded-xl overflow-hidden min-w-0">
              <CardContent className="p-4 sm:p-5 flex items-center gap-3">
                <div className={`p-2.5 rounded-xl shrink-0 ${stat.bg}`}>
                  {stat.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-500 mb-0.5">{stat.label}</p>
                  <p className="text-lg sm:text-xl font-bold text-[#1A365D] tabular-nums truncate">{stat.value}</p>
                  {stat.badges && stat.badges.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {stat.badges.map((b) => (
                        <span
                          key={b}
                          className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  )}
                  {stat.badges && stat.badges.length === 0 && !statsLoading && (
                    <p className="text-xs text-slate-400 mt-1">No badges yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 min-w-0">
        {/* 3. UPCOMING SESSIONS */}
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
          <div className="space-y-3 min-w-0">
            {upcomingBookings.length > 0 ? (
              upcomingBookings.map((b) => (
                <Card key={b.id} className="border-slate-200 rounded-xl p-4 flex items-center justify-between gap-3 min-w-0">
                  <div className="min-w-0">
                    <p className="font-semibold text-[#1A365D] truncate">{b.learnerName || 'Learner'}</p>
                    <p className="text-sm text-slate-500">
                      {b.date} · {b.startTime} – {b.endTime}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-slate-500"
                    onClick={() => navigate('/tutor/bookings')}
                  >
                    View <ChevronRight size={16} />
                  </Button>
                </Card>
              ))
            ) : (
              <Card className="border-slate-100 rounded-2xl sm:rounded-[24px] p-6 sm:p-8 border-dashed flex flex-col items-center justify-center text-center min-w-0">
                <div className="bg-slate-50 p-4 rounded-full mb-4">
                  <Calendar className="text-slate-300" size={32} />
                </div>
                <p className="text-slate-500 font-medium text-sm sm:text-base">No sessions scheduled yet</p>
                <Button
                  variant="outline"
                  className="mt-4 rounded-xl border-slate-200 text-[#1A365D] w-full sm:w-auto"
                  onClick={() => navigate('/tutor/tuition-requests')}
                >
                  Browse tuition requests
                </Button>
              </Card>
            )}
            {upcomingBookings.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full rounded-xl border-slate-200 text-[#1A365D]"
                onClick={() => navigate('/tutor/tuition-requests')}
              >
                Browse tuition requests
              </Button>
            )}
          </div>
        </div>

        {/* WALLET SECTION */}
        <div className="space-y-4 sm:space-y-6 min-w-0">
          <div className="flex items-center justify-between gap-2 px-0 sm:px-2 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-[#1A365D] truncate">Wallet</h2>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 rounded-xl border-slate-200 text-[#1A365D]"
              onClick={() => navigate('/tutor/earnings')}
            >
              View Wallet <ChevronRight size={16} />
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 min-w-0">
            <Card className="border-slate-200 rounded-xl overflow-hidden min-w-0">
              <CardContent className="p-3 sm:p-4">
                <p className="text-xs font-medium text-slate-500 mb-0.5">Pending</p>
                <p className="text-base sm:text-lg font-bold text-[#1A365D] tabular-nums truncate">
                  {statsLoading ? '—' : formatEarnings(wallet?.pendingEarnings ?? 0)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 rounded-xl overflow-hidden min-w-0">
              <CardContent className="p-3 sm:p-4">
                <p className="text-xs font-medium text-slate-500 mb-0.5">Available</p>
                <p className="text-base sm:text-lg font-bold text-[#1A365D] tabular-nums truncate">
                  {statsLoading ? '—' : formatEarnings(wallet?.availableEarnings ?? 0)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 rounded-xl overflow-hidden min-w-0">
              <CardContent className="p-3 sm:p-4">
                <p className="text-xs font-medium text-slate-500 mb-0.5">Total</p>
                <p className="text-base sm:text-lg font-bold text-[#1A365D] tabular-nums truncate">
                  {statsLoading ? '—' : formatEarnings(wallet?.totalEarnings ?? 0)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 rounded-xl overflow-hidden min-w-0">
              <CardContent className="p-3 sm:p-4">
                <p className="text-xs font-medium text-slate-500 mb-0.5">Withdrawn</p>
                <p className="text-base sm:text-lg font-bold text-[#1A365D] tabular-nums truncate">
                  {statsLoading ? '—' : formatEarnings(wallet?.withdrawnTotal ?? 0)}
                </p>
              </CardContent>
            </Card>
          </div>
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
