/**
 * Learner Reviews
 * Lists reviews the learner has submitted for completed bookings.
 */

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Star, Calendar, User } from 'lucide-react';
import { getMySubmittedReviews } from '@/services/reviewService';

function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString(undefined, { dateStyle: 'medium' });
}

function formatTime(t) {
  if (t == null || t === '') return '';
  return String(t).substring(0, 5);
}

function LearnerReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getMySubmittedReviews();
        setReviews(data.reviews || []);
      } catch (err) {
        setError(err.message || 'Failed to load your reviews');
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-[#1A365D]">Your Reviews</h1>
        <p className="mt-2 text-slate-500">
          Reviews you have submitted for completed sessions.
        </p>
      </div>

      {loading ? (
        <Card className="border-slate-100 rounded-2xl">
          <CardContent className="p-12 text-center text-slate-500">
            Loading your reviews…
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-slate-100 rounded-2xl">
          <CardContent className="p-12 text-center text-destructive">
            {error}
          </CardContent>
        </Card>
      ) : reviews.length === 0 ? (
        <Card className="border-slate-100 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Reviews you have submitted for completed bookings will appear here.
              Complete a session and leave a review from your booking to see it here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card
              key={review.id}
              className="border-slate-100 rounded-2xl shadow-sm overflow-hidden"
            >
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <User size={16} className="text-slate-400 shrink-0" />
                        {review.tutorName}
                      </span>
                      {(review.bookingDate || review.bookingStartTime) && (
                        <span className="flex items-center gap-1.5 text-slate-500 text-sm">
                          <Calendar size={14} className="text-slate-400 shrink-0" />
                          {formatDate(review.bookingDate)}
                          {review.bookingStartTime && (
                            <> · {formatTime(review.bookingStartTime)}
                              {review.bookingEndTime && ` – ${formatTime(review.bookingEndTime)}`}
                            </>
                          )}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            size={18}
                            className={
                              i <= review.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-200'
                            }
                          />
                        ))}
                      </div>
                      <span className="text-sm text-slate-500">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                    {review.reviewText && (
                      <p className="mt-3 text-slate-600 text-sm leading-relaxed">
                        {review.reviewText}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default LearnerReviews;
