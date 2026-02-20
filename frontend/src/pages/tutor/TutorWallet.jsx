/**
 * Tutor Wallet Page
 * Wallet summary and withdraw flow: request withdrawal (PENDING); no immediate deduction.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  getWallet,
  createWithdrawalRequest,
  getBankDetails,
  updateBankDetails,
  getMyWithdrawalRequests,
} from '@/services/tutorWalletService';

function formatAmount(pence) {
  if (pence == null || !Number.isFinite(pence)) return '—';
  return `£${(pence / 100).toFixed(2)}`;
}

function formatDate(createdAt) {
  if (!createdAt) return '—';
  const d = new Date(createdAt);
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function statusLabel(status) {
  if (status === 'pendingRelease') return 'Pending release';
  if (status === 'available') return 'Available';
  return status || '—';
}

function TutorWallet() {
  const navigate = useNavigate();
  const [data, setData] = useState({
    totalEarnings: 0,
    pendingEarnings: 0,
    availableEarnings: 0,
    withdrawnTotal: 0,
    hasBankDetails: false,
    canWithdraw: false,
    minWithdrawalAmount: 0,
    pendingWithdrawal: null,
    entries: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [withdrawAmountPounds, setWithdrawAmountPounds] = useState('');
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
  const [withdrawError, setWithdrawError] = useState(null);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [bankDetails, setBankDetails] = useState(null);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [bankFormSubmitting, setBankFormSubmitting] = useState(false);
  const [bankFormError, setBankFormError] = useState(null);
  const [bankForm, setBankForm] = useState({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    country: 'GB',
    sortCode: '',
    ifscCode: '',
  });
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const res = await getWallet();
      setData({
        totalEarnings: res.totalEarnings ?? 0,
        pendingEarnings: res.pendingEarnings ?? 0,
        availableEarnings: res.availableEarnings ?? 0,
        withdrawnTotal: res.withdrawnTotal ?? 0,
        hasBankDetails: res.hasBankDetails ?? false,
        canWithdraw: res.canWithdraw ?? false,
        minWithdrawalAmount: res.minWithdrawalAmount ?? 0,
        pendingWithdrawal: res.pendingWithdrawal ?? null,
        entries: res.entries ?? [],
      });
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load wallet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  useEffect(() => {
    const fetchBankAndHistory = async () => {
      try {
        const [bankRes, historyRes] = await Promise.all([
          getBankDetails().catch(() => null),
          getMyWithdrawalRequests().catch(() => ({ withdrawalRequests: [] })),
        ]);
        setBankDetails(bankRes);
        setWithdrawalRequests(historyRes.withdrawalRequests || []);
      } catch {
        setBankDetails(null);
        setWithdrawalRequests([]);
      }
    };
    if (!loading && !error) fetchBankAndHistory();
  }, [loading, error]);

  const handleWithdraw = async (e) => {
    e?.preventDefault?.();
    setWithdrawError(null);
    const pounds = parseFloat(withdrawAmountPounds);
    if (Number.isNaN(pounds) || pounds <= 0) {
      setWithdrawError('Please enter a valid amount in pounds.');
      return;
    }
    const amountInPaise = Math.round(pounds * 100);
    if (amountInPaise <= 0) {
      setWithdrawError('Amount must be greater than zero.');
      return;
    }
    const minPaise = data.minWithdrawalAmount ?? 0;
    if (minPaise > 0 && amountInPaise < minPaise) {
      setWithdrawError(`Amount must be at least ${formatAmount(minPaise)} (minimum withdrawal).`);
      return;
    }
    if (amountInPaise > (data.availableEarnings ?? 0)) {
      setWithdrawError(`Amount cannot exceed available balance (${formatAmount(data.availableEarnings)}).`);
      return;
    }
    setWithdrawSubmitting(true);
    try {
      await createWithdrawalRequest(amountInPaise);
      setWithdrawAmountPounds('');
      setWithdrawModalOpen(false);
      await fetchWallet();
      const historyRes = await getMyWithdrawalRequests().catch(() => ({ withdrawalRequests: [] }));
      setWithdrawalRequests(historyRes.withdrawalRequests || []);
    } catch (err) {
      setWithdrawError(err.message || 'Failed to submit withdrawal request');
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  const openBankModal = () => {
    setBankFormError(null);
    setBankForm({
      accountHolderName: bankDetails?.accountHolderName ?? '',
      bankName: bankDetails?.bankName ?? '',
      accountNumber: '',
      country: bankDetails?.country ?? 'GB',
      sortCode: '',
      ifscCode: '',
    });
    setBankModalOpen(true);
  };

  const handleBankSubmit = async (e) => {
    e.preventDefault();
    setBankFormError(null);
    setBankFormSubmitting(true);
    try {
      const payload = {
        accountHolderName: bankForm.accountHolderName.trim(),
        bankName: bankForm.bankName.trim(),
        accountNumber: bankForm.accountNumber.trim(),
        country: bankForm.country,
      };
      if (bankForm.country === 'GB' || bankForm.country === 'UK') payload.sortCode = bankForm.sortCode.trim();
      if (bankForm.country === 'IN') payload.ifscCode = bankForm.ifscCode.trim();
      const updated = await updateBankDetails(payload);
      setBankDetails(updated);
      setBankModalOpen(false);
      await fetchWallet();
    } catch (err) {
      setBankFormError(err.message || 'Failed to save bank details');
    } finally {
      setBankFormSubmitting(false);
    }
  };

  const withdrawalStatusBadge = (status) => {
    const map = {
      PENDING: 'bg-amber-100 text-amber-800',
      APPROVED: 'bg-blue-100 text-blue-800',
      REJECTED: 'bg-red-100 text-red-800',
      PAID: 'bg-emerald-100 text-emerald-800',
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  };

  const showWithdrawForm =
    data.hasBankDetails &&
    data.canWithdraw &&
    !data.pendingWithdrawal;
  const minPounds = (data.minWithdrawalAmount ?? 0) / 100;
  const maxPounds = (data.availableEarnings ?? 0) / 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="container mx-auto max-w-4xl">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">Loading wallet...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="container mx-auto max-w-4xl">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-destructive">{error}</p>
              <div className="mt-4 flex justify-center">
                <Button variant="outline" onClick={() => navigate('/tutor')}>
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Wallet</h1>
          <Button variant="outline" onClick={() => navigate('/tutor')}>
            Dashboard
          </Button>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium text-muted-foreground">
                Pending earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{formatAmount(data.pendingEarnings)}</p>
              <p className="text-xs text-muted-foreground">In escrow until session completes</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium text-muted-foreground">
                Available earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{formatAmount(data.availableEarnings)}</p>
              <p className="text-xs text-muted-foreground">Withdrawable (net of approved withdrawals)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium text-muted-foreground">
                Total earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{formatAmount(data.totalEarnings)}</p>
              <p className="text-xs text-muted-foreground">Pending + available</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium text-muted-foreground">
                Withdrawn total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{formatAmount(data.withdrawnTotal)}</p>
              <p className="text-xs text-muted-foreground">Paid out to your bank</p>
            </CardContent>
          </Card>
        </div>

        {/* Bank Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Bank details</CardTitle>
            <p className="text-sm text-muted-foreground">
              Required to receive withdrawals. Account number is stored securely and shown masked after save.
            </p>
          </CardHeader>
          <CardContent>
            {bankDetails ? (
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="text-muted-foreground">Account holder:</span>{' '}
                  {bankDetails.accountHolderName}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Bank:</span> {bankDetails.bankName}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Account:</span> {bankDetails.maskedAccountNumber}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Sort code / IFSC:</span>{' '}
                  {bankDetails.maskedSortCodeOrIfsc}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Country:</span> {bankDetails.country}
                </p>
                <Button variant="outline" size="sm" onClick={openBankModal}>
                  Update bank details
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-muted-foreground mb-3">
                  Add your bank details to request withdrawals.
                </p>
                <Button onClick={openBankModal}>
                  Add bank details
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bank details pop-up form */}
        {bankModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
              <h3 className="text-lg font-semibold mb-1">
                {bankDetails ? 'Update bank details' : 'Add bank details'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Account number is stored securely and shown masked after save.
              </p>
              <form onSubmit={handleBankSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="modal-accountHolderName">Account holder name</Label>
                    <Input
                      id="modal-accountHolderName"
                      value={bankForm.accountHolderName}
                      onChange={(e) => setBankForm((f) => ({ ...f, accountHolderName: e.target.value }))}
                      required
                      placeholder="John Smith"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modal-bankName">Bank name</Label>
                    <Input
                      id="modal-bankName"
                      value={bankForm.bankName}
                      onChange={(e) => setBankForm((f) => ({ ...f, bankName: e.target.value }))}
                      required
                      placeholder="e.g. Barclays"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modal-accountNumber">Account number</Label>
                  <Input
                    id="modal-accountNumber"
                    type="text"
                    inputMode="numeric"
                    value={bankForm.accountNumber}
                    onChange={(e) => setBankForm((f) => ({ ...f, accountNumber: e.target.value.replace(/\D/g, '') }))}
                    required
                    placeholder="8 digits"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modal-country">Country</Label>
                  <select
                    id="modal-country"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={bankForm.country}
                    onChange={(e) => setBankForm((f) => ({ ...f, country: e.target.value }))}
                  >
                    <option value="GB">United Kingdom</option>
                    <option value="IN">India</option>
                  </select>
                </div>
                {(bankForm.country === 'GB' || bankForm.country === 'UK') && (
                  <div className="space-y-2">
                    <Label htmlFor="modal-sortCode">Sort code</Label>
                    <Input
                      id="modal-sortCode"
                      value={bankForm.sortCode}
                      onChange={(e) => setBankForm((f) => ({ ...f, sortCode: e.target.value }))}
                      placeholder="12-34-56"
                    />
                  </div>
                )}
                {bankForm.country === 'IN' && (
                  <div className="space-y-2">
                    <Label htmlFor="modal-ifscCode">IFSC code</Label>
                    <Input
                      id="modal-ifscCode"
                      value={bankForm.ifscCode}
                      onChange={(e) => setBankForm((f) => ({ ...f, ifscCode: e.target.value }))}
                      placeholder="e.g. SBIN0001234"
                    />
                  </div>
                )}
                {bankFormError && <p className="text-sm text-destructive">{bankFormError}</p>}
                <div className="flex gap-2 justify-end pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setBankModalOpen(false); setBankFormError(null); }}
                    disabled={bankFormSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={bankFormSubmitting}>
                    {bankFormSubmitting ? 'Saving…' : 'Save'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Withdraw */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Withdraw</CardTitle>
            <p className="text-sm text-muted-foreground">
              Request a withdrawal to your bank account. Your request will be reviewed; funds are not deducted until processed.
            </p>
          </CardHeader>
          <CardContent>
            {!data.hasBankDetails && (
              <p className="text-muted-foreground">
                Add bank details before you can request a withdrawal.
              </p>
            )}
            {data.hasBankDetails && !data.canWithdraw && !data.pendingWithdrawal && (
              <p className="text-muted-foreground">
                Available balance must be at least {formatAmount(data.minWithdrawalAmount)} to withdraw.
              </p>
            )}
            {data.pendingWithdrawal && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Pending withdrawal request
                </p>
                <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                  {formatAmount(data.pendingWithdrawal.amountRequested)} requested on{' '}
                  {formatDate(data.pendingWithdrawal.requestedAt)}. You cannot submit another request until this one is processed.
                </p>
              </div>
            )}
            {showWithdrawForm && (
              <Button onClick={() => { setWithdrawError(null); setWithdrawAmountPounds(''); setWithdrawModalOpen(true); }}>
                Request withdrawal
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Withdraw modal */}
        {withdrawModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 space-y-4">
              <h3 className="text-lg font-semibold">Request withdrawal</h3>
              <p className="text-sm text-muted-foreground">
                Available: {formatAmount(data.availableEarnings)}. Minimum: {formatAmount(data.minWithdrawalAmount)}.
              </p>
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="modal-withdraw-amount">Amount (£)</Label>
                  <Input
                    id="modal-withdraw-amount"
                    type="number"
                    min={minPounds}
                    max={maxPounds}
                    step="0.01"
                    placeholder={minPounds > 0 ? `Min ${minPounds.toFixed(2)}` : '0.00'}
                    value={withdrawAmountPounds}
                    onChange={(e) => setWithdrawAmountPounds(e.target.value)}
                    disabled={withdrawSubmitting}
                  />
                </div>
                {withdrawError && <p className="text-sm text-destructive">{withdrawError}</p>}
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setWithdrawModalOpen(false)} disabled={withdrawSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={withdrawSubmitting}>
                    {withdrawSubmitting ? 'Submitting…' : 'Confirm request'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Withdrawal history */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Withdrawal history</CardTitle>
            <p className="text-sm text-muted-foreground">
              Past withdrawal requests and their status.
            </p>
          </CardHeader>
          <CardContent>
            {withdrawalRequests.length === 0 ? (
              <p className="py-6 text-center text-muted-foreground">No withdrawal requests yet.</p>
            ) : (
              <ul className="divide-y">
                {withdrawalRequests.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 sm:flex-nowrap">
                    <div className="min-w-0">
                      <p className="font-medium tabular-nums">{formatAmount(r.amountRequested)}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(r.requestedAt)}</p>
                    </div>
                    <span className={`rounded px-2 py-0.5 text-xs font-medium shrink-0 ${withdrawalStatusBadge(r.status)}`}>
                      {r.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Earnings history</CardTitle>
            <p className="text-sm text-muted-foreground">
              Ledger entries by booking.
            </p>
          </CardHeader>
          <CardContent>
            {data.entries.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                No earnings entries yet.
              </p>
            ) : (
              <ul className="divide-y">
                {data.entries.map((e) => (
                  <li
                    key={e.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 sm:flex-nowrap"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-muted-foreground">
                        {formatDate(e.createdAt)}
                      </p>
                      <p className="text-sm">
                        {e.bookingId ? (
                          <Button
                            variant="link"
                            className="h-auto p-0 text-left font-normal text-primary underline-offset-4 hover:underline"
                            onClick={() => navigate(`/tutor/bookings/${e.bookingId}`)}
                          >
                            Booking
                          </Button>
                        ) : (
                          'Booking'
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          e.status === 'available'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {statusLabel(e.status)}
                      </span>
                      <span className="font-medium tabular-nums">{formatAmount(e.amount)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default TutorWallet;
