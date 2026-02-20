/**
 * Admin: Dispute detail
 * View booking details, learner & tutor evidence, payment amount.
 * Resolve dispute with outcome selection.
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getCurrentRole, getStoredUser } from '@/services/authService';
import { getDispute, resolveDispute } from '@/services/adminService';
import { toast } from 'sonner';
import '../../styles/Profile.css';

const OUTCOMES = [
  { value: 'RELEASE_PAYMENT_TO_TUTOR', label: 'Release payment to tutor' },
  { value: 'FULL_REFUND', label: 'Full refund to learner' },
  { value: 'PARTIAL_REFUND', label: 'Partial refund to learner' },
];

function AdminDisputeDetail() {
  const { disputeId } = useParams();
  const navigate = useNavigate();
  const role = getCurrentRole();
  const isAdmin = typeof role === 'string' && role === 'Admin';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dispute, setDispute] = useState(null);
  const [outcome, setOutcome] = useState('');
  const [refundAmountInPaise, setRefundAmountInPaise] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resolveError, setResolveError] = useState(null);

  useEffect(() => {
    if (!isAdmin || !disputeId) {
      setLoading(false);
      return;
    }

    const fetchDispute = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getDispute(disputeId);
        setDispute(data);
      } catch (err) {
        setError(err.message || 'Failed to load dispute');
      } finally {
        setLoading(false);
      }
    };

    fetchDispute();
  }, [isAdmin, disputeId]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (start, end) => {
    if (!start || !end) return '—';
    const fmt = (t) => {
      const [h, m] = (t || '').split(':');
      const hour = parseInt(h, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${m || '00'} ${ampm}`;
    };
    return `${fmt(start)} – ${fmt(end)}`;
  };

  const formatAmount = (pence) => {
    if (pence == null || pence === '') return '—';
    const pounds = Number(pence) / 100;
    return `£${pounds.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleResolve = async () => {
    if (!disputeId || !outcome) return;
    if (outcome === 'PARTIAL_REFUND') {
      const amount = parseInt(refundAmountInPaise, 10);
      if (!Number.isInteger(amount) || amount <= 0) {
        setResolveError('Enter a valid refund amount in pence');
        return;
      }
    }

    setSubmitting(true);
    setResolveError(null);
    try {
      const body = { outcome };
      if (outcome === 'PARTIAL_REFUND') {
        body.refundAmountInPaise = parseInt(refundAmountInPaise, 10);
      }
      await resolveDispute(disputeId, body);
      toast.success('Dispute has been resolved.');
      const data = await getDispute(disputeId);
      setDispute(data);
    } catch (err) {
      setResolveError(err.message || 'Failed to resolve dispute');
    } finally {
      setSubmitting(false);
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
            <p className="text-center text-muted-foreground">Loading dispute…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !dispute) {
    return (
      <div className="space-y-6">
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardContent className="p-6">
            <p className="text-center text-destructive font-medium">{error || 'Dispute not found.'}</p>
            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={() => navigate('/admin/disputes')} className="rounded-lg">
                Back to Disputes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOpen = dispute.status === 'OPEN';
  const b = dispute.booking;

  return (
    <div className="profile-page-content max-w-2xl">
      <div className="profile-intro flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A365D] flex items-center gap-2">
            <AlertCircle className="h-7 w-7" />
            Dispute Detail
          </h1>
          <p className="text-sm text-slate-500 mt-1">View booking, evidence and resolve.</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/admin/disputes')} className="rounded-lg">
          Back to Disputes
        </Button>
      </div>

      <div
        className={`mt-6 rounded-2xl border px-3 py-2 text-sm font-medium ${
          isOpen ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'
        }`}
      >
        Status: {dispute.status}
        {dispute.outcome && ` · Outcome: ${dispute.outcome.replace(/_/g, ' ')}`}
      </div>

      <Card className="rounded-2xl border-gray-100 shadow-sm mt-6">
        <CardHeader>
            <CardTitle className="text-[#1A365D]">Booking</CardTitle>
            <CardDescription>Session details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-medium text-muted-foreground">Date</dt>
                <dd>{formatDate(b?.date)}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Time</dt>
                <dd>{formatTime(b?.startTime, b?.endTime)}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Learner</dt>
                <dd>{b?.learnerName ?? '—'}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Tutor</dt>
                <dd>{b?.tutorName ?? '—'}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Booking status</dt>
                <dd>{b?.status ?? '—'}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Payment amount</dt>
                <dd className="font-medium">{formatAmount(dispute.amountInPaise)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-100 shadow-sm mt-6">
          <CardHeader>
            <CardTitle className="text-[#1A365D]">Evidence</CardTitle>
            <CardDescription>Learner and tutor submissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="mb-1 text-sm font-medium text-muted-foreground">Learner evidence</h3>
              <p className="rounded-md border bg-muted/30 p-3 text-sm">
                {dispute.learnerEvidence || <span className="italic text-muted-foreground">No evidence submitted</span>}
              </p>
            </div>
            <div>
              <h3 className="mb-1 text-sm font-medium text-muted-foreground">Tutor evidence</h3>
              <p className="rounded-md border bg-muted/30 p-3 text-sm">
                {dispute.tutorEvidence || <span className="italic text-muted-foreground">No evidence submitted</span>}
              </p>
            </div>
          </CardContent>
        </Card>

        {isOpen && (
          <Card className="rounded-2xl border-amber-200 shadow-sm mt-6">
            <CardHeader>
              <CardTitle className="text-[#1A365D]">Resolve dispute</CardTitle>
              <CardDescription>Select outcome and submit. Decision is final.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="outcome" className="text-sm">
                  Outcome
                </Label>
                <Select value={outcome} onValueChange={setOutcome}>
                  <SelectTrigger id="outcome" className="mt-1">
                    <SelectValue placeholder="Select outcome" />
                  </SelectTrigger>
                  <SelectContent>
                    {OUTCOMES.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {outcome === 'PARTIAL_REFUND' && (
                <div>
                  <Label htmlFor="refundAmount" className="text-sm">
                    Refund amount (pence)
                  </Label>
                  <Input
                    id="refundAmount"
                    type="number"
                    min={1}
                    max={dispute.amountInPaise ?? 0}
                    placeholder="e.g. 50000"
                    value={refundAmountInPaise}
                    onChange={(e) => setRefundAmountInPaise(e.target.value)}
                    className="mt-1"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Full amount: {dispute.amountInPaise ?? '—'} pence ({formatAmount(dispute.amountInPaise)})
                  </p>
                </div>
              )}

              {resolveError && (
                <p className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {resolveError}
                </p>
              )}

              <Button
                disabled={
                  !outcome ||
                  submitting ||
                  (outcome === 'PARTIAL_REFUND' && (!refundAmountInPaise || parseInt(refundAmountInPaise, 10) <= 0))
                }
                onClick={handleResolve}
                className="bg-[#1A365D] hover:bg-[#1A365D]/90 rounded-lg"
              >
                {submitting ? 'Submitting…' : 'Submit resolution'}
              </Button>
            </CardContent>
          </Card>
        )}

        {!isOpen && dispute.resolvedAt && (
          <Card className="rounded-2xl border-gray-100 shadow-sm mt-6">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Resolved at {new Date(dispute.resolvedAt).toLocaleString()}
                {dispute.refundAmountInPaise != null && (
                  <> · Refund: {formatAmount(dispute.refundAmountInPaise)}</>
                )}
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  );
}

export default AdminDisputeDetail;
