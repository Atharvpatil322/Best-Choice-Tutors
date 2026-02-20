/**
 * Admin Financial Overview
 * Displays payments summary, escrow, payouts, refunds, disputes count.
 * Fetches from GET /api/admin/financials.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  Lock,
  ArrowUpRight,
  ArrowDownLeft,
  AlertCircle,
  Banknote,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCurrentRole, getStoredUser } from '@/services/authService';
import { getFinancials } from '@/services/adminService';
import '../../styles/Profile.css';

function AdminFinancials() {
  const navigate = useNavigate();
  const role = getCurrentRole();
  const isAdmin = typeof role === 'string' && role === 'Admin';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [financials, setFinancials] = useState(null);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    const fetchFinancials = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getFinancials();
        setFinancials(data);
      } catch (err) {
        setError(err.message || 'Failed to load financial overview');
        setFinancials(null);
      } finally {
        setLoading(false);
      }
    };

    fetchFinancials();
  }, [isAdmin]);

  const formatCurrency = (pence) => {
    if (pence == null || typeof pence !== 'number') return '£0';
    const pounds = pence / 100;
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(pounds);
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
              <Button variant="outline" onClick={() => navigate(-1)} className="rounded-lg">
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
            <p className="text-center text-muted-foreground">Loading financial overview…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="profile-page-content">
      <div className="profile-intro">
        <h1 className="text-2xl font-bold text-[#1A365D] flex items-center gap-2">
          <Banknote className="h-7 w-7" />
          Financial Overview
        </h1>
        <p className="text-sm text-slate-500 mt-1">Payments, escrow, payouts, refunds and disputes.</p>
      </div>

      {error && (
        <Card className="mt-6 rounded-2xl border-red-200 bg-red-50 shadow-sm">
          <CardContent className="p-4">
            <p className="text-destructive font-medium">{error}</p>
          </CardContent>
        </Card>
      )}

      {financials && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6">
          <Card className="rounded-2xl border-gray-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                  Payments summary
                </CardTitle>
                <Wallet className="h-4 w-4 text-[#1A365D]" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-[#1A365D]">
                  {formatCurrency(financials.totalPayments)}
                </p>
                <p className="text-xs text-muted-foreground">Total payments received</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-gray-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                  Escrow total
                </CardTitle>
                <Lock className="h-4 w-4 text-[#1A365D]" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-[#1A365D]">
                  {formatCurrency(financials.totalEscrow)}
                </p>
                <p className="text-xs text-muted-foreground">Pending release</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-gray-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                  Payouts
                </CardTitle>
                <ArrowUpRight className="h-4 w-4 text-[#1A365D]" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-[#1A365D]">
                  {formatCurrency(financials.totalPaidOut)}
                </p>
                <p className="text-xs text-muted-foreground">Released to tutors</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-gray-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                  Refunds
                </CardTitle>
                <ArrowDownLeft className="h-4 w-4 text-[#1A365D]" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-[#1A365D]">
                  {formatCurrency(financials.totalRefunded)}
                </p>
                <p className="text-xs text-muted-foreground">Refunded to learners</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-gray-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                  Disputes count
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-[#1A365D]" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-[#1A365D]">
                  {financials.activeDisputesCount ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">Open disputes</p>
              </CardContent>
            </Card>
          </div>
        )}

        {financials && (
          <Card className="rounded-2xl border-gray-100 shadow-sm mt-6">
            <CardHeader>
              <CardTitle className="text-[#1A365D]">Quick actions</CardTitle>
              <CardDescription>
                Review and resolve open disputes from the disputes page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => navigate('/admin/disputes')} className="rounded-lg">
                View disputes
              </Button>
            </CardContent>
          </Card>
        )}
    </div>
  );
}

export default AdminFinancials;
