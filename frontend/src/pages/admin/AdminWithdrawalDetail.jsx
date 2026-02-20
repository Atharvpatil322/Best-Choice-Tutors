/**
 * Admin: Withdrawal request detail
 * Tutor info, available balance, bank details (masked), actions: Approve, Reject, Mark as Paid.
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Wallet } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getCurrentRole, getStoredUser } from '@/services/authService';
import {
  getWithdrawalRequests,
  approveWithdrawalRequest,
  rejectWithdrawalRequest,
  markWithdrawalPaid,
} from '@/services/adminService';
import { toast } from 'sonner';
import '../../styles/Profile.css';

function formatAmount(paise) {
  if (paise == null || !Number.isFinite(paise)) return '—';
  return `£${(paise / 100).toFixed(2)}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function AdminWithdrawalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const role = getCurrentRole();
  const isAdmin = typeof role === 'string' && role === 'Admin';

  const [request, setRequest] = useState(location.state?.request ?? null);
  const [loading, setLoading] = useState(!location.state?.request);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [paidRef, setPaidRef] = useState('');

  useEffect(() => {
    if (!isAdmin || !id) {
      setLoading(false);
      return;
    }

    if (location.state?.request) {
      setLoading(false);
      return;
    }

    const fetchOne = async () => {
      try {
        setLoading(true);
        const [pendingRes, approvedRes] = await Promise.all([
          getWithdrawalRequests('PENDING').catch(() => ({ withdrawalRequests: [] })),
          getWithdrawalRequests('APPROVED').catch(() => ({ withdrawalRequests: [] })),
        ]);
        const all = [
          ...(pendingRes.withdrawalRequests || []),
          ...(approvedRes.withdrawalRequests || []),
        ];
        const found = all.find((r) => r.id === id);
        setRequest(found || null);
        if (!found) setError('Withdrawal request not found or already processed');
      } catch (err) {
        setError(err.message || 'Failed to load request');
        setRequest(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOne();
  }, [isAdmin, id, location.state?.request]);

  const handleApprove = async () => {
    if (!id) return;
    setActionLoading('approve');
    try {
      await approveWithdrawalRequest(id);
      toast.success('Withdrawal approved.');
      navigate('/admin/withdrawals');
    } catch (err) {
      toast.error(err.message || 'Failed to approve');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!id) return;
    setActionLoading('reject');
    try {
      await rejectWithdrawalRequest(id);
      toast.success('Withdrawal rejected.');
      navigate('/admin/withdrawals');
    } catch (err) {
      toast.error(err.message || 'Failed to reject');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkPaid = async () => {
    if (!id) return;
    setActionLoading('paid');
    try {
      await markWithdrawalPaid(id, paidRef.trim() || undefined);
      toast.success('Marked as paid.');
      navigate('/admin/withdrawals');
    } catch (err) {
      toast.error(err.message || 'Failed to mark as paid');
    } finally {
      setActionLoading(null);
    }
  };

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

  if (loading) {
    return (
      <Card className="rounded-2xl border-gray-100">
        <CardContent className="p-8 text-center text-muted-foreground">Loading…</CardContent>
      </Card>
    );
  }

  if (error || !request) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate('/admin/withdrawals')}>
          <ArrowLeft size={16} /> Back to Withdrawals
        </Button>
        <Card className="rounded-2xl border-gray-100">
          <CardContent className="p-6">
            <p className="text-center text-destructive">{error || 'Request not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const bank = request.bankDetailsSnapshot || {};
  const isPending = request.status === 'PENDING';
  const isApproved = request.status === 'APPROVED';

  return (
    <div className="profile-page-content min-w-0 overflow-x-hidden space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate('/admin/withdrawals')}>
          <ArrowLeft size={16} /> Back
        </Button>
      </div>

      <div className="profile-intro flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1A365D] flex items-center gap-2">
            <Wallet className="h-6 w-6 shrink-0" />
            Withdrawal request
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {formatAmount(request.amountRequested)} · Requested {formatDate(request.requestedAt)}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            request.status === 'PENDING'
              ? 'bg-amber-100 text-amber-800'
              : request.status === 'APPROVED'
                ? 'bg-blue-100 text-blue-800'
                : request.status === 'PAID'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-red-100 text-red-800'
          }`}
        >
          {request.status}
        </span>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="rounded-2xl border-gray-100">
          <CardHeader>
            <CardTitle className="text-base">Tutor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="font-medium">{request.tutor?.fullName || '—'}</p>
            {request.tutor?.email && <p className="text-sm text-muted-foreground">{request.tutor.email}</p>}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-100">
          <CardHeader>
            <CardTitle className="text-base">Balance & amount</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p>
              <span className="text-muted-foreground">Available balance:</span>{' '}
              <span className="font-semibold tabular-nums">{formatAmount(request.availableBalancePaise)}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Requested:</span>{' '}
              <span className="font-semibold tabular-nums">{formatAmount(request.amountRequested)}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-gray-100">
        <CardHeader>
          <CardTitle className="text-base">Bank details (masked)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p><span className="text-muted-foreground">Account holder:</span> {bank.accountHolderName || '—'}</p>
          <p><span className="text-muted-foreground">Bank:</span> {bank.bankName || '—'}</p>
          <p><span className="text-muted-foreground">Account:</span> {bank.maskedAccountNumber || '—'}</p>
          <p><span className="text-muted-foreground">Sort code / IFSC:</span> {bank.maskedSortCodeOrIfsc || '—'}</p>
          <p><span className="text-muted-foreground">Country:</span> {bank.country || '—'}</p>
        </CardContent>
      </Card>

      {isPending && (
        <Card className="rounded-2xl border-gray-100">
          <CardHeader>
            <CardTitle className="text-base">Actions</CardTitle>
            <p className="text-sm text-muted-foreground">Approve to record deduction; reject to close without payment.</p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button
              onClick={handleApprove}
              disabled={!!actionLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {actionLoading === 'approve' ? 'Processing…' : 'Approve'}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!!actionLoading}
            >
              {actionLoading === 'reject' ? 'Processing…' : 'Reject'}
            </Button>
          </CardContent>
        </Card>
      )}

      {isApproved && (
        <Card className="rounded-2xl border-gray-100">
          <CardHeader>
            <CardTitle className="text-base">Mark as paid</CardTitle>
            <p className="text-sm text-muted-foreground">After transferring money to the tutor, record the payout.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 max-w-xs">
              <Label htmlFor="tx-ref">Transaction reference (optional)</Label>
              <Input
                id="tx-ref"
                value={paidRef}
                onChange={(e) => setPaidRef(e.target.value)}
                placeholder="e.g. bank transfer ref"
              />
            </div>
            <Button
              onClick={handleMarkPaid}
              disabled={!!actionLoading}
            >
              {actionLoading === 'paid' ? 'Processing…' : 'Mark as paid'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AdminWithdrawalDetail;
