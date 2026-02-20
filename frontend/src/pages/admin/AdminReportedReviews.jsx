/**
 * Admin: Reported Reviews
 * Read-only list of reported reviews. No approve/reject/delete actions.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCurrentRole, getStoredUser } from '@/services/authService';
import { getReportedReviews } from '@/services/adminService';
import '../../styles/Profile.css';

function AdminReportedReviews() {
  const navigate = useNavigate();
  const role = getCurrentRole();
  const isAdmin = typeof role === 'string' && role === 'Admin';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportedReviews, setReportedReviews] = useState([]);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    const fetchReviews = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getReportedReviews();
        setReportedReviews(data.reportedReviews || []);
      } catch (err) {
        setError(err.message || 'Failed to load reported reviews');
        setReportedReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [isAdmin]);

  const formatDate = (dateVal) => {
    if (!dateVal) return '—';
    const d = new Date(dateVal);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
            <p className="text-center text-muted-foreground">Loading reported reviews...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="profile-page-content">
      <div className="profile-intro">
        <h1 className="text-2xl font-bold text-[#1A365D] flex items-center gap-2">
          <Star className="h-7 w-7" />
          Reported Reviews
        </h1>
        <p className="text-sm text-slate-500 mt-1">Read-only list of reported reviews.</p>
      </div>

      <Card className="rounded-2xl border-gray-100 shadow-sm mt-6">
        <CardHeader>
            <CardTitle className="text-[#1A365D]">Reported reviews</CardTitle>
            <CardDescription>
              Read-only list. No approve, reject, or delete actions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <p className="text-destructive">{error}</p>
            ) : reportedReviews.length === 0 ? (
              <p className="text-muted-foreground">No reported reviews.</p>
            ) : (
              <ul className="space-y-6">
                {reportedReviews.map((review) => (
                  <li
                    key={review.id}
                    className="rounded-lg border border-input p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <Star
                            key={value}
                            className={`h-4 w-4 ${
                              value <= (review.rating || 0)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-muted-foreground/40'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Review created: {formatDate(review.createdAt)}
                      </span>
                    </div>

                    {review.reviewText ? (
                      <p className="text-sm text-foreground">{review.reviewText}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No review text</p>
                    )}

                    <dl className="grid gap-2 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="font-medium text-muted-foreground">Tutor</dt>
                        <dd>{review.tutorName ?? '—'}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-muted-foreground">Learner</dt>
                        <dd>{review.learnerName ?? '—'}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-muted-foreground">Booking ID</dt>
                        <dd className="font-mono text-xs">{review.bookingId ?? '—'}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-muted-foreground">Reported date</dt>
                        <dd>{formatDate(review.reportedAt)}</dd>
                      </div>
                    </dl>

                    <div>
                      <dt className="font-medium text-muted-foreground text-sm">Reported reason</dt>
                      <dd className="mt-1 text-sm">
                        {review.reportedReason ?? <span className="italic text-muted-foreground">No reason provided</span>}
                      </dd>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
    </div>
  );
}

export default AdminReportedReviews;
