/**
 * Admin Layout
 * Persistent left sidebar for all /admin/* routes. Main content via Outlet.
 * Visual style aligned with Learner and Tutor dashboards (#1A365D, #F1F5F9, rounded cards).
 * Admin role required; access denied otherwise.
 * Responsive: sidebar becomes overlay on mobile; header and main adapt to screen size.
 */

import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCurrentRole, getStoredUser, logout } from '@/services/authService';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ShieldCheck,
  Banknote,
  Wallet,
  AlertCircle,
  MessageSquare,
  ClipboardList,
  Settings,
  Star,
  LogOut,
  Menu,
  X,
  LifeBuoy,
  Megaphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import logoImage from '../images/BCT_Logo.png';

const SIDEBAR_ITEMS = [
  { to: '/admin', end: true, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', end: true, label: 'Users', icon: Users },
  { to: '/admin/tutors/pending', end: true, label: 'Tutor Verification', icon: GraduationCap },
  { to: '/admin/dbs', end: true, label: 'DBS Verification', icon: ShieldCheck },
  { to: '/admin/financials', end: true, label: 'Financial Overview', icon: Banknote },
  { to: '/admin/withdrawals', end: false, label: 'Withdrawals', icon: Wallet },
  { to: '/admin/disputes', end: false, label: 'Disputes', icon: AlertCircle },
  { to: '/admin/chat', end: true, label: 'Chat Viewer', icon: MessageSquare },
  { to: '/admin/reported-reviews', end: true, label: 'Reported Reviews', icon: Star },
  { to: '/admin/audit-log', end: true, label: 'Audit Logs', icon: ClipboardList },
  { to: '/admin/config', end: true, label: 'Platform Configuration', icon: Settings },
  { to: '/admin/notifications', end: true, label: 'Broadcast notification', icon: Megaphone },
  { to: '/admin/support', end: false, label: 'Support Tickets', icon: LifeBuoy },
];

function AdminLayout() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const role = getCurrentRole();
  const isAdmin = typeof role === 'string' && role === 'Admin';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center px-4 py-8">
        <Card className="max-w-md w-full rounded-2xl border-gray-100 shadow-sm">
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
    <div className="flex flex-col min-h-screen bg-[#F1F5F9] overflow-x-hidden">
      <header className="h-14 sm:h-16 lg:h-20 shrink-0 bg-white px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-2 border-b border-gray-100 sticky top-0 z-30 w-full mt-2 sm:mt-[1em] mx-2 sm:mx-4 lg:mx-auto max-w-[100vw] rounded-2xl sm:rounded-[32px] shadow-sm">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            className="lg:hidden p-2 -ml-1 text-[#1A365D] hover:bg-gray-100 rounded-lg"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <img src={logoImage} alt="BCT Logo" className="h-8 sm:h-10 shrink-0" />
          <h2 className="text-base sm:text-lg font-bold text-[#1A365D] truncate">Admin</h2>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-gray-200">
            <div className="hidden md:block text-right min-w-0">
              <p className="text-sm font-bold text-[#1A365D] leading-none truncate max-w-[120px] lg:max-w-none">{user?.name || 'Admin'}</p>
            </div>
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 shrink-0"
              aria-label="Log out"
            >
              <LogOut size={20} className="rotate-180" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <div
          className={cn(
            'fixed inset-0 bg-black/40 z-30 transition-opacity lg:hidden',
            sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />

        <aside
          className={cn(
            'w-[260px] max-w-[85vw] bg-[#1A365D] flex flex-col fixed z-40 shadow-xl overflow-hidden transition-transform duration-200 ease-out',
            'left-0 top-14 bottom-0 sm:top-16 lg:left-4 lg:top-24 lg:bottom-4 lg:mt-2 lg:rounded-[24px] rounded-r-[24px]',
            'lg:flex lg:translate-x-0',
            sidebarOpen ? 'flex translate-x-0' : 'hidden -translate-x-full'
          )}
        >
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/10">
            <span className="text-white font-semibold">Menu</span>
            <button type="button" onClick={() => setSidebarOpen(false)} className="p-2 text-white/80 hover:text-white rounded-lg" aria-label="Close menu">
              <X size={20} />
            </button>
          </div>
          <nav className="flex-1 px-4 space-y-1 mt-4 lg:mt-8 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                      isActive ? 'bg-white/10 text-[#4FD1C5] shadow-inner' : 'text-white/70 hover:bg-white/5 hover:text-white'
                    )
                  }
                >
                  <Icon size={18} className="shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
          <div className="p-4 border-t border-white/10 mb-2 shrink-0">
            <div className="flex items-center justify-between gap-2 bg-white/5 p-3 rounded-2xl">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.name || 'Admin'}</p>
                <p className="text-[10px] text-white/50">{role}</p>
              </div>
              <button type="button" onClick={() => { logout(); navigate('/'); }} className="text-white/40 hover:text-white transition-transform hover:scale-110 shrink-0" aria-label="Log out">
                <LogOut size={16} className="rotate-180" />
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0 ml-0 lg:ml-[280px] p-4 sm:p-6 overflow-y-auto overflow-x-hidden h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] lg:h-[calc(100vh-80px)]">
          <div className="bg-white rounded-2xl sm:rounded-[32px] min-h-full border border-gray-100 shadow-sm p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
