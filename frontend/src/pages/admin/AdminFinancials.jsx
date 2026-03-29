/**
 * Admin Financial Overview
 * Displays payments summary, escrow, payouts, refunds.
 * Fetches from GET /api/admin/financials.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  Lock,
  ArrowUpRight,
  ArrowDownLeft,
  Banknote,
  FileSpreadsheet,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCurrentRole, getStoredUser } from '@/services/authService';
import { exportFinancialsExcel, getFinancials } from '@/services/adminService';
import '../../styles/Profile.css';

function AdminFinancials() {
  const navigate = useNavigate();
  const role = getCurrentRole();
  const isAdmin = typeof role === 'string' && role === 'Admin';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [financials, setFinancials] = useState(null);
  const [exporting, setExporting] = useState(false);

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

  const handleExportFinancials = async () => {
    try {
      setExporting(true);
      setError(null);

      const { blob, filename } = await exportFinancialsExcel();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'financial_overview.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Failed to export financials');
    } finally {
      setExporting(false);
    }
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
        <h1 className="text-xl sm:text-2xl font-bold text-[#1A365D] flex items-center gap-2 flex-wrap min-w-0">
          <Banknote className="h-7 w-7 shrink-0" />
          Financial Overview
        </h1>
        <p className="text-sm text-slate-500 mt-1">Payments, escrow, payouts and refunds.</p>

        <div className="mt-4 flex flex-col sm:flex-row sm:justify-end sm:items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportFinancials}
            disabled={exporting}
            className="rounded-lg gap-1 w-full sm:w-auto"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {exporting ? 'Exporting…' : 'Export Excel'}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="mt-6 rounded-2xl border-red-200 bg-red-50 shadow-sm">
          <CardContent className="p-4">
            <p className="text-destructive font-medium">{error}</p>
          </CardContent>
        </Card>
      )}

      {financials && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6 min-w-0">
          <Card className="rounded-2xl border-gray-100 shadow-sm min-w-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2 min-w-0">
                <CardTitle className="text-sm font-medium text-slate-500 min-w-0">
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

            <Card className="rounded-2xl border-gray-100 shadow-sm min-w-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2 min-w-0">
                <CardTitle className="text-sm font-medium text-slate-500 min-w-0">
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

            <Card className="rounded-2xl border-gray-100 shadow-sm min-w-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2 min-w-0">
                <CardTitle className="text-sm font-medium text-slate-500 min-w-0">
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

            <Card className="rounded-2xl border-gray-100 shadow-sm min-w-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2 min-w-0">
                <CardTitle className="text-sm font-medium text-slate-500 min-w-0">
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
          </div>
        )}
    </div>
  );
}

export default AdminFinancials;
