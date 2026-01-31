/**
 * Browse Tuition Requests (Tutor)
 * Phase 9: Verified tutors view active tuition requests and express interest
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getActiveTuitionRequestsForTutor, expressInterest } from '@/services/tuitionRequestService';
import { toast } from 'sonner';

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
      toast.success('Interest sent');
    } catch (err) {
      const msg = err.message || 'Failed to express interest';
      toast.error(msg);
      if (msg.toLowerCase().includes('already expressed')) {
        setExpressedIds((prev) => new Set(prev).add(requestId));
      }
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Tuition requests</h1>
          <Button variant="outline" onClick={() => navigate('/tutor/dashboard')}>
            Back to dashboard
          </Button>
        </div>

        {loading && (
          <p className="text-muted-foreground">Loading requests…</p>
        )}

        {!loading && accessError && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive">{accessError}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Only verified tutors can browse tuition requests. Complete verification to access.
              </p>
            </CardContent>
          </Card>
        )}

        {!loading && !accessError && requests.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">No active tuition requests right now.</p>
            </CardContent>
          </Card>
        )}

        {!loading && !accessError && requests.length > 0 && (
          <div className="space-y-4">
            {requests.map((r) => {
              const expressed = expressedIds.has(r.id);
              const submitting = submittingId === r.id;
              return (
                <Card key={r.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{r.subject}</CardTitle>
                    <CardDescription className="flex flex-wrap gap-x-4 gap-y-1">
                      <span>Budget: £{r.budget}/hr</span>
                      <span>Mode: {r.mode.replace('_', '-')}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {r.description}
                    </p>
                    <div>
                      <Button
                        size="sm"
                        onClick={() => handleExpressInterest(r.id)}
                        disabled={expressed || submitting}
                      >
                        {expressed ? 'Interest sent' : submitting ? 'Sending…' : 'Express interest'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default BrowseTuitionRequests;
