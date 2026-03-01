/**
 * Admin Dashboard
 * Welcome, quick links. No API calls — each tab fetches its own data when visited.
 */

import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, GraduationCap, ShieldCheck, Banknote, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCurrentRole, getStoredUser } from '@/services/authService';
import '../../styles/Profile.css';

function AdminDashboard() {
  const navigate = useNavigate();
  const role = getCurrentRole();
  const isAdmin = typeof role === 'string' && role === 'Admin';

  const quickLinks = [
    { label: 'Users', icon: <Users className="h-5 w-5 text-blue-600" />, bg: 'bg-blue-50', path: '/admin/users' },
    { label: 'Tutor Verification', icon: <GraduationCap className="h-5 w-5 text-emerald-600" />, bg: 'bg-emerald-50', path: '/admin/tutors/pending' },
    { label: 'DBS Verification', icon: <ShieldCheck className="h-5 w-5 text-slate-600" />, bg: 'bg-slate-100', path: '/admin/dbs' },
    { label: 'Financial Overview', icon: <Banknote className="h-5 w-5 text-purple-600" />, bg: 'bg-purple-50', path: '/admin/financials' },
  ];

  if (!getStoredUser()) {
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardContent className="p-6">
            <p className="text-center text-destructive font-medium">Access denied. Admin only.</p>
            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={() => navigate('/')} className="rounded-lg">
                Go back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="profile-page-content min-w-0 overflow-x-hidden">
      <div className="profile-intro">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1A365D] flex items-center gap-2 min-w-0">
          <LayoutDashboard className="h-6 w-6 sm:h-7 sm:w-7 shrink-0" />
          <span className="truncate">Admin Dashboard</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">Welcome, {getStoredUser()?.name || 'Admin'}</p>
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Quick links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
    </div>
  );
}

export default AdminDashboard;
