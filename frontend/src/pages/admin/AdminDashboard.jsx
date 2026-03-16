/**
 * Admin Dashboard
 * Welcome, financial overview (summary + chart), and quick links.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ShieldCheck,
  Banknote,
  ChevronRight,
  Wallet,
  Lock,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCurrentRole, getStoredUser } from '@/services/authService';
import { getSummary, getFinancials } from '@/services/adminService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import '../../styles/Profile.css';

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

const CHART_COLORS = ['#1A365D', '#059669', '#2563eb', '#64748b'];

function AdminDashboard() {
  const navigate = useNavigate();
  const role = getCurrentRole();
  const isAdmin = typeof role === 'string' && role === 'Admin';

  const [summary, setSummary] = useState(null);
  const [financials, setFinancials] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const quickLinks = [
    { label: 'Users', icon: <Users className="h-5 w-5 text-blue-600" />, bg: 'bg-blue-50', path: '/admin/users' },
    { label: 'Tutor Verification', icon: <GraduationCap className="h-5 w-5 text-emerald-600" />, bg: 'bg-emerald-50', path: '/admin/tutors/pending' },
    { label: 'DBS Verification', icon: <ShieldCheck className="h-5 w-5 text-slate-600" />, bg: 'bg-slate-100', path: '/admin/dbs' },
    { label: 'Financial Overview', icon: <Banknote className="h-5 w-5 text-purple-600" />, bg: 'bg-purple-50', path: '/admin/financials' },
  ];

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [summaryRes, financialsRes] = await Promise.all([
          getSummary(),
          getFinancials(),
        ]);
        if (!cancelled) {
          setSummary(summaryRes);
          setFinancials(financialsRes);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load dashboard data');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [isAdmin]);

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

      {error && (
        <Card className="mt-6 rounded-2xl border-red-200 bg-red-50 shadow-sm">
          <CardContent className="p-4">
            <p className="text-destructive font-medium">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Financial overview – graphical */}
      <div className="mt-6">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            Financial overview
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#1A365D]"
            onClick={() => navigate('/admin/financials')}
          >
            View full report
            <ChevronRight size={16} className="ml-0.5" />
          </Button>
        </div>

        {loading ? (
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardContent className="p-8">
              <p className="text-center text-muted-foreground">Loading financial data…</p>
            </CardContent>
          </Card>
        ) : (summary || financials) ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card className="rounded-xl border-slate-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                  <CardTitle className="text-xs font-medium text-slate-500">Total payments</CardTitle>
                  <Wallet className="h-4 w-4 text-[#1A365D]" />
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-lg font-bold text-[#1A365D]">
                    {financials ? formatCurrency(financials.totalPayments) : '—'}
                  </p>
                </CardContent>
              </Card>
              <Card className="rounded-xl border-slate-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                  <CardTitle className="text-xs font-medium text-slate-500">Escrow</CardTitle>
                  <Lock className="h-4 w-4 text-[#1A365D]" />
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-lg font-bold text-[#1A365D]">
                    {financials ? formatCurrency(financials.totalEscrow) : '—'}
                  </p>
                </CardContent>
              </Card>
              <Card className="rounded-xl border-slate-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                  <CardTitle className="text-xs font-medium text-slate-500">Payouts</CardTitle>
                  <ArrowUpRight className="h-4 w-4 text-[#1A365D]" />
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-lg font-bold text-[#1A365D]">
                    {financials ? formatCurrency(financials.totalPaidOut) : '—'}
                  </p>
                </CardContent>
              </Card>
              <Card className="rounded-xl border-slate-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                  <CardTitle className="text-xs font-medium text-slate-500">Refunds</CardTitle>
                  <ArrowDownLeft className="h-4 w-4 text-[#1A365D]" />
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-lg font-bold text-[#1A365D]">
                    {financials ? formatCurrency(financials.totalRefunded) : '—'}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-[#1A365D] flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Payments breakdown
                </CardTitle>
                <CardDescription>Compare total payments, escrow, payouts and refunds (GBP)</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-6">
                <div className="min-h-[260px] w-full">
                  {(() => {
                    const chartData = financials
                      ? [
                          { name: 'Payments', value: financials.totalPayments / 100, fullLabel: formatCurrency(financials.totalPayments) },
                          { name: 'Escrow', value: financials.totalEscrow / 100, fullLabel: formatCurrency(financials.totalEscrow) },
                          { name: 'Payouts', value: financials.totalPaidOut / 100, fullLabel: formatCurrency(financials.totalPaidOut) },
                          { name: 'Refunds', value: financials.totalRefunded / 100, fullLabel: formatCurrency(financials.totalRefunded) },
                        ]
                      : [];
                    return chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart
                          data={chartData}
                          margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
                          accessibilityLayer
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-200" />
                          <XAxis
                            dataKey="name"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tick={{ fontSize: 12, fill: '#64748b' }}
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tick={{ fontSize: 12, fill: '#64748b' }}
                            tickFormatter={(v) => `£${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0].payload;
                              return (
                                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
                                  <p className="font-medium text-slate-900">{d.name}</p>
                                  <p className="text-sm text-slate-600">{d.fullLabel}</p>
                                </div>
                              );
                            }}
                          />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={80}>
                            {chartData.map((_, index) => (
                              <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-[260px] items-center justify-center text-slate-500 text-sm">
                        No financial data yet
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>

      <div className="mt-8">
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
