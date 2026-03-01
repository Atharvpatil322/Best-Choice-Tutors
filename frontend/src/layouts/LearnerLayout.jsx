/**
 * Learner Layout
 * Persistent left sidebar for all /dashboard/* routes. Main content via Outlet.
 * LEARNER role required; access denied otherwise.
 * Responsive: sidebar becomes overlay on mobile; header and main adapt to screen size.
 */

import { useCallback, useEffect, useState, useRef } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCurrentRole, getStoredUser, logout } from '@/services/authService';
import { getNotifications, markAllNotificationsRead } from '@/services/notificationService';
import {
  LayoutDashboard,
  Calendar,
  FileText,
  MessageSquare,
  Star,
  User,
  LogOut,
  Home,
  BookOpen,
  CreditCard,
  Settings,
  LifeBuoy,
  Bell,
  Menu,
  X,
  Megaphone,
  Scale,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import logoImage from '../images/BCT_Logo.png'
import { ProfileAvatar } from '@/components/ProfileAvatar';

const SIDEBAR_ITEMS = [
  { to: '/dashboard', end: true, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/dashboard/browse-tutors', end: true, label: 'Browse Tutors', icon: BookOpen },
  { to: '/dashboard/bookings', end: false, label: 'My Bookings', icon: Calendar },
  { to: '/dashboard/tuition-requests', end: false, label: 'Tuition Requests', icon: FileText },
  { to: '/dashboard/messages', end: true, label: 'Messages', icon: MessageSquare },
  { to: '/dashboard/reviews', end: true, label: 'Reviews', icon: Star },
  { to: '/dashboard/profile', end: true, label: 'Profile', icon: User },
  { to: '/dashboard/policy', end: true, label: 'Policy', icon: Scale },
  { to: '/dashboard/support', end: false, label: 'Support', icon: LifeBuoy },
];

function LearnerLayout() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const role = getCurrentRole();
  const isLearner = typeof role === 'string' && role.toLowerCase() === 'learner';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const notificationsRef = useRef(null);
  const [headerProfilePhoto, setHeaderProfilePhoto] = useState(null);

  // Fetch notifications only when user opens dropdown (on-demand), not on mount
  const fetchNotifications = useCallback(async (markAsRead = false) => {
    if (!isLearner) return;
    setNotificationsLoading(true);
    try {
      const { notifications: list, unreadCount: count } = await getNotifications();
      setNotifications(
        (list || []).map((n) => ({
          ...n,
          id: n._id || n.id,
          timestamp: n.createdAt || n.timestamp,
        }))
      );
      setUnreadCount(count ?? 0);
      if (markAsRead && (count ?? 0) > 0) {
        await markAllNotificationsRead();
        setUnreadCount(0);
      }
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setNotificationsLoading(false);
    }
  }, [isLearner]);

  // Update header photo when learner updates profile (e.g. from MyProfile page)
  useEffect(() => {
    const onProfilePhotoUpdated = () => {
      const u = getStoredUser();
      setHeaderProfilePhoto(u?.profilePhoto ?? null);
    };
    window.addEventListener('profilePhotoUpdated', onProfilePhotoUpdated);
    return () => window.removeEventListener('profilePhotoUpdated', onProfilePhotoUpdated);
  }, []);

  useEffect(() => {
    if (notificationsOpen && isLearner) fetchNotifications(true);
  }, [notificationsOpen, isLearner, fetchNotifications]);

  useEffect(() => {
    if (!notificationsOpen) return;
    const handleClickOutside = (e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [notificationsOpen]);

  if (!user || !isLearner) return null;

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
          <h2 className="text-base sm:text-lg font-bold text-[#1A365D] truncate">Home</h2>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 shrink-0">
          <div className="relative" ref={notificationsRef}>
            <button
              type="button"
              onClick={() => setNotificationsOpen((o) => !o)}
              className="relative p-2 text-gray-500 hover:bg-gray-50 rounded-full"
              aria-label="Notifications"
            >
              <Bell size={20} className="sm:w-[22px] sm:h-[22px]" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 rounded-full border-2 border-white text-[11px] text-white font-medium">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            {notificationsOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl border border-gray-200 shadow-lg z-50 max-h-[70vh] overflow-hidden flex flex-col">
                <div className="p-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-[#1A365D]">Notifications</h3>
                </div>
                <div className="overflow-y-auto flex-1">
                  {notificationsLoading ? (
                    <p className="p-4 text-sm text-gray-500 text-center">Loading…</p>
                  ) : notifications.length === 0 ? (
                    <p className="p-4 text-sm text-gray-500 text-center">No notifications yet.</p>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {notifications.map((n) => (
                        <li key={n.id} className="p-3 hover:bg-gray-50">
                          <div className="flex gap-2">
                            {n.type === 'admin_broadcast' && (
                              <Megaphone size={16} className="text-amber-600 shrink-0 mt-0.5" />
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900">{n.title || 'Notification'}</p>
                              <p className="text-xs text-gray-600 mt-0.5">{n.message}</p>
                              {n.timestamp && (
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(n.timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                                </p>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
          <Link
            to="/dashboard/profile"
            className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-gray-200 hover:opacity-90 transition-opacity min-w-0"
            aria-label="Go to my profile"
          >
            <ProfileAvatar
              src={user?.profilePhoto || headerProfilePhoto}
              alt="Profile"
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover shrink-0 border-2 border-gray-100"
              iconClassName="h-4 w-4 sm:h-5 sm:w-5"
            />
            <div className="hidden md:block text-left min-w-0">
              <p className="text-sm font-bold text-[#1A365D] leading-none truncate max-w-[120px] lg:max-w-none">{user?.name || 'Learner'}</p>
            </div>
          </Link>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* BACKDROP - MOBILE ONLY WHEN SIDEBAR OPEN */}
        <div
          className={cn(
            'fixed inset-0 bg-black/40 z-30 transition-opacity lg:hidden',
            sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />

        {/* SIDEBAR - FIXED ON LG, OVERLAY ON MOBILE */}
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
          <nav className="flex-1 px-4 space-y-1 mt-4 lg:mt-8 overflow-y-auto">
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
                      isActive
                        ? 'bg-white/10 text-[#4FD1C5] shadow-inner'
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                    )
                  }
                >
                  <Icon size={18} className="shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/10 mb-2 shrink-0">
            <div className="flex items-center justify-between gap-3 bg-white/5 p-3 rounded-2xl">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.name || 'Learner'}</p>
                <p className="text-[10px] text-white/50 capitalize">{role}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="text-white/40 hover:text-white transition-transform hover:scale-110 shrink-0"
                aria-label="Log out"
              >
                <LogOut size={16} className="rotate-180" />
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT - FULL WIDTH ON MOBILE, MARGIN ON LG */}
        <main className="flex-1 min-w-0 ml-0 lg:ml-[280px] p-4 sm:p-6 overflow-y-auto overflow-x-hidden h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] lg:h-[calc(100vh-80px)]">
          <div className="bg-white rounded-2xl sm:rounded-[32px] min-h-full border border-gray-100 shadow-sm p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default LearnerLayout;