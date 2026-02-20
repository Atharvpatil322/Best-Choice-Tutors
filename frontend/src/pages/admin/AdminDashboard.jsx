/**
 * Admin Dashboard
 * Displays summary stats: users, tutors, bookings, revenue, escrow.
 * Fetches from GET /api/admin/summary.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, GraduationCap, Calendar, Wallet, Lock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCurrentRole, getStoredUser } from '@/services/authService';
import { getSummary } from '@/services/adminService';
import '../../styles/Profile.css';

function AdminDashboard() {
  const navigate = useNavigate();
  const role = getCurrentRole();
  const isAdmin = typeof role === 'string' && role === 'Admin';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    const fetchSummary = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getSummary();
        setSummary(data);
      } catch (err) {
        setError(err.message || 'Failed to load summary');
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [isAdmin]);

  // Paise to rupees (divide by 100)
  const formatCurrency = (paise) => {
    if (paise == null || typeof paise !== 'number') return '₹0';
    const rupees = paise / 100;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(rupees);
  };

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

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Loading dashboard…</p>
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
        <p className="text-sm text-slate-500 mt-1">Platform summary and key metrics</p>
      </div>

      {error && (
        <Card className="mt-6 rounded-2xl border-red-200 bg-red-50 shadow-sm min-w-0">
          <CardContent className="p-4">
            <p className="text-destructive font-medium break-words">{error}</p>
          </CardContent>
        </Card>
      )}

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 min-w-0">
          <Card className="rounded-2xl border-gray-100 shadow-sm min-w-0 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 truncate">Users</CardTitle>
              <Users className="h-4 w-4 text-[#1A365D] shrink-0" />
            </CardHeader>
            <CardContent>
              <p className="text-xl sm:text-2xl font-bold text-[#1A365D] truncate">{summary.totalUsers ?? 0}</p>
              <p className="text-xs text-muted-foreground">Total registered users</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-gray-100 shadow-sm min-w-0 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 truncate">Tutors</CardTitle>
              <GraduationCap className="h-4 w-4 text-[#1A365D] shrink-0" />
            </CardHeader>
            <CardContent>
              <p className="text-xl sm:text-2xl font-bold text-[#1A365D] truncate">{summary.totalTutors ?? 0}</p>
              <p className="text-xs text-muted-foreground">Tutor profiles</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-gray-100 shadow-sm min-w-0 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 truncate">Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-[#1A365D] shrink-0" />
            </CardHeader>
            <CardContent>
              <p className="text-xl sm:text-2xl font-bold text-[#1A365D] truncate">{summary.totalBookings ?? 0}</p>
              <p className="text-xs text-muted-foreground">Total bookings</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-gray-100 shadow-sm min-w-0 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 truncate">Revenue</CardTitle>
              <Wallet className="h-4 w-4 text-[#1A365D] shrink-0" />
            </CardHeader>
            <CardContent>
              <p className="text-xl sm:text-2xl font-bold text-[#1A365D] truncate">{formatCurrency(summary.totalRevenue)}</p>
              <p className="text-xs text-muted-foreground">Released to tutors</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-gray-100 shadow-sm min-w-0 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 truncate">Escrow</CardTitle>
              <Lock className="h-4 w-4 text-[#1A365D] shrink-0" />
            </CardHeader>
            <CardContent>
              <p className="text-xl sm:text-2xl font-bold text-[#1A365D] truncate">{formatCurrency(summary.totalEscrowAmount)}</p>
              <p className="text-xs text-muted-foreground">Pending release</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
