/**
 * Tutor Wallet Page
 * Wallet summary: pending earnings, available earnings, total earnings, and earnings history.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getWallet } from '@/services/tutorWalletService';

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

function formatPaidDate(paidAt) {
  if (!paidAt) return null;
  const d = new Date(paidAt);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function statusLabel(status, paidAt) {
  if (status === 'pendingRelease') return 'Pending release';
  if (status === 'available') {
    if (paidAt) return 'Paid out';
    return 'Available';
  }
  return status || '—';
}

function TutorWallet() {
  const navigate = useNavigate();
  const [data, setData] = useState({
    totalEarnings: 0,
    pendingEarnings: 0,
    availableEarnings: 0,
    paidOutEarnings: 0,
    entries: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const res = await getWallet();
      setData({
        totalEarnings: res.totalEarnings ?? 0,
        pendingEarnings: res.pendingEarnings ?? 0,
        availableEarnings: res.availableEarnings ?? 0,
        paidOutEarnings: res.paidOutEarnings ?? 0,
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
              <p className="text-xs text-muted-foreground">Current balance in connected Stripe account</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium text-muted-foreground">
                Paid out
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{formatAmount(data.paidOutEarnings)}</p>
              <p className="text-xs text-muted-foreground">Sent to bank account</p>
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
              <p className="text-xs text-muted-foreground">Available + paid out</p>
            </CardContent>
          </Card>
        </div>

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
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {e.paidAt && (
                        <p className="text-xs text-muted-foreground">
                          Paid {formatPaidDate(e.paidAt)}
                        </p>
                      )}
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${
                            e.status === 'available'
                              ? e.paidAt
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {statusLabel(e.status, e.paidAt)}
                        </span>
                        <span className="font-medium tabular-nums">
                          {formatAmount(e.netAmount ?? e.amount)}
                        </span>
                      </div>
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
