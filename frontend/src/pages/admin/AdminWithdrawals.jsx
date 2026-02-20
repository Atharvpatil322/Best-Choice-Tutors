/**
 * Admin: Withdrawal requests list
 * Lists PENDING withdrawal requests. Links to detail for approve/reject/mark paid.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCurrentRole, getStoredUser } from '@/services/authService';
import { getWithdrawalRequests } from '@/services/adminService';
import '../../styles/Profile.css';

function formatAmount(paise) {
  if (paise == null || !Number.isFinite(paise)) return '—';
  return `£${(paise / 100).toFixed(2)}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function AdminWithdrawals() {
  const navigate = useNavigate();
  const role = getCurrentRole();
  const isAdmin = typeof role === 'string' && role === 'Admin';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [pendingRes, approvedRes] = await Promise.all([
          getWithdrawalRequests('PENDING').catch(() => ({ withdrawalRequests: [] })),
          getWithdrawalRequests('APPROVED').catch(() => ({ withdrawalRequests: [] })),
        ]);
        setPending(pendingRes.withdrawalRequests || []);
        setApproved(approvedRes.withdrawalRequests || []);
      } catch (err) {
        setError(err.message || 'Failed to load withdrawal requests');
        setPending([]);
        setApproved([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin]);

  if (!getStoredUser()) return null;

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardContent className="p-6">
            <p className="text-center text-destructive font-medium">Access denied. Admin only.</p>
            <Button variant="outline" className="mt-4 rounded-lg mx-auto block" onClick={() => navigate(-1)}>
              Go back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="profile-page-content min-w-0 overflow-x-hidden">
      <div className="profile-intro">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1A365D] flex items-center gap-2 min-w-0">
          <Wallet className="h-6 w-6 sm:h-7 sm:w-7 shrink-0" />
          <span className="truncate">Withdrawals</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">Review and process pending withdrawal requests</p>
      </div>

      {error && (
        <Card className="mt-6 rounded-2xl border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-destructive font-medium">{error}</p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card className="mt-6 rounded-2xl border-gray-100">
          <CardContent className="p-8 text-center text-muted-foreground">Loading…</CardContent>
        </Card>
      ) : pending.length === 0 && approved.length === 0 ? (
        <Card className="mt-6 rounded-2xl border-gray-100">
          <CardContent className="p-8 text-center text-muted-foreground">
            No pending or approved withdrawal requests.
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-6">
          {pending.length > 0 && (
            <Card className="rounded-2xl border-gray-100 overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Pending requests</CardTitle>
                <p className="text-sm text-muted-foreground">Approve or reject</p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="text-left p-3 font-medium">Tutor</th>
                        <th className="text-right p-3 font-medium">Amount</th>
                        <th className="text-left p-3 font-medium">Request date</th>
                        <th className="p-3 w-24" />
                      </tr>
                    </thead>
                    <tbody>
                      {pending.map((r) => (
                        <tr key={r.id} className="border-b last:border-0 hover:bg-slate-50/50">
                          <td className="p-3">
                            <p className="font-medium truncate max-w-[180px]">{r.tutor?.fullName || '—'}</p>
                            {r.tutor?.email && (
                              <p className="text-xs text-muted-foreground truncate max-w-[180px]">{r.tutor.email}</p>
                            )}
                          </td>
                          <td className="p-3 text-right font-medium tabular-nums">{formatAmount(r.amountRequested)}</td>
                          <td className="p-3 text-muted-foreground">{formatDate(r.requestedAt)}</td>
                          <td className="p-3">
                            <Button
                              size="sm"
                              className="rounded-lg"
                              onClick={() => navigate(`/admin/withdrawals/${r.id}`, { state: { request: r } })}
                            >
                              Review
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
          {approved.length > 0 && (
            <Card className="rounded-2xl border-gray-100 overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Approved (awaiting payout)</CardTitle>
                <p className="text-sm text-muted-foreground">Mark as paid after transferring money</p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="text-left p-3 font-medium">Tutor</th>
                        <th className="text-right p-3 font-medium">Amount</th>
                        <th className="text-left p-3 font-medium">Request date</th>
                        <th className="p-3 w-24" />
                      </tr>
                    </thead>
                    <tbody>
                      {approved.map((r) => (
                        <tr key={r.id} className="border-b last:border-0 hover:bg-slate-50/50">
                          <td className="p-3">
                            <p className="font-medium truncate max-w-[180px]">{r.tutor?.fullName || '—'}</p>
                          </td>
                          <td className="p-3 text-right font-medium tabular-nums">{formatAmount(r.amountRequested)}</td>
                          <td className="p-3 text-muted-foreground">{formatDate(r.requestedAt)}</td>
                          <td className="p-3">
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-lg"
                              onClick={() => navigate(`/admin/withdrawals/${r.id}`, { state: { request: r } })}
                            >
                              Mark paid
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminWithdrawals;
