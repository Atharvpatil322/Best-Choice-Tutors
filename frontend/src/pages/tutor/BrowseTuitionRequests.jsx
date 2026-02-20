/**
 * Browse Tuition Requests (Tutor)
 * Verified tutors view active tuition requests (subject-filtered) and express interest.
 * UI aligned with Tutor dashboard: card layout, typography, palette.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getActiveTuitionRequestsForTutor, expressInterest } from '@/services/tuitionRequestService';
import { toast } from 'sonner';
import { PoundSterling, Video, Calendar, BookOpen, CheckCircle } from 'lucide-react';

function formatPostedDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function BrowseTuitionRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState(null);
  const [expressedIds, setExpressedIds] = useState(new Set());
  const [submittingId, setSubmittingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setAccessError(null);
    getActiveTuitionRequestsForTutor()
      .then((data) => {
        if (!cancelled) {
          setRequests(data.requests || []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setRequests([]);
          setAccessError(err.message || 'Failed to load requests');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleExpressInterest = async (requestId) => {
    setSubmittingId(requestId);
    try {
      await expressInterest(requestId);
      setExpressedIds((prev) => new Set(prev).add(requestId));
      toast.success('Interest has been sent to the learner.');
    } catch (err) {
      const msg = err.message || 'Failed to express interest';
      toast.error(msg || 'Could not send interest. Please try again.');
      if (msg.toLowerCase().includes('already expressed')) {
        setExpressedIds((prev) => new Set(prev).add(requestId));
      }
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1A365D]">Tuition requests</h1>
          <p className="mt-1 text-slate-500">
            Requests matching your subjects. Express interest to get in touch with learners.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/tutor')}
          className="rounded-xl border-slate-200 text-[#1A365D] hover:bg-slate-50 shrink-0"
        >
          Back to dashboard
        </Button>
      </div>

      {loading && (
        <Card className="border-slate-100 rounded-2xl shadow-sm">
          <CardContent className="p-8">
            <p className="text-center text-slate-500">Loading requests…</p>
          </CardContent>
        </Card>
      )}

      {!loading && accessError && (
        <Card className="border-slate-100 rounded-2xl shadow-sm">
          <CardContent className="p-8 space-y-2">
            <p className="text-red-600 font-medium">{accessError}</p>
            <p className="text-sm text-slate-500">
              Only verified tutors can browse tuition requests. Complete verification to access.
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && !accessError && requests.length === 0 && (
        <Card className="border-slate-100 rounded-2xl shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="bg-slate-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="text-slate-400" size={28} />
            </div>
            <p className="text-slate-500 font-medium">No active tuition requests right now.</p>
            <p className="text-sm text-slate-400 mt-1">Check back later or update your subjects to see more requests.</p>
          </CardContent>
        </Card>
      )}

      {!loading && !accessError && requests.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((r) => {
            const expressed = expressedIds.has(r.id);
            const submitting = submittingId === r.id;
            return (
              <Card
                key={r.id}
                className="border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col hover:border-slate-200 transition-colors"
              >
                <CardContent className="p-6 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <h3 className="text-lg font-bold text-[#1A365D] leading-tight">
                      {(r.subjects && r.subjects.length > 0) ? r.subjects.join(', ') : r.subject || '—'}
                    </h3>
                    {expressed && (
                      <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold">
                        <CheckCircle size={14} /> Interest sent
                      </span>
                    )}
                  </div>

                  <ul className="space-y-2 text-sm text-slate-600 mb-4">
                    <li className="flex items-center gap-2">
                      <PoundSterling size={16} className="text-slate-400 shrink-0" />
                      <span>£{r.budget}/hr</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Video size={16} className="text-slate-400 shrink-0" />
                      <span className="capitalize">{r.mode.replace('_', ' ')}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Calendar size={16} className="text-slate-400 shrink-0" />
                      <span>Posted {formatPostedDate(r.createdAt)}</span>
                    </li>
                  </ul>

                  <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed flex-1 min-h-[3.75rem]">
                    {r.description}
                  </p>

                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <Button
                      className="w-full rounded-xl h-11 font-bold bg-[#1A365D] hover:bg-[#1A365D]/90"
                      onClick={() => handleExpressInterest(r.id)}
                      disabled={expressed || submitting}
                    >
                      {expressed
                        ? 'Interest sent'
                        : submitting
                          ? 'Sending…'
                          : 'Express interest'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default BrowseTuitionRequests;
