/**
 * My Tuition Requests (Learner)
 * Phase 9: List learner's tuition requests; view interested tutors per request; proceed to booking flow (no chat).
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { getMyTuitionRequests, getInterestedTutorsForRequest } from '@/services/tuitionRequestService';

function MyTuitionRequestsList() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getMyTuitionRequests()
      .then((data) => {
        if (!cancelled) setRequests(data.requests || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load requests');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">My tuition requests</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Dashboard
            </Button>
            <Button onClick={() => navigate('/tuition-requests/new')}>
              New request
            </Button>
          </div>
        </div>

        {loading && <p className="text-muted-foreground">Loading…</p>}
        {error && <p className="text-destructive">{error}</p>}

        {!loading && !error && requests.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">You have no tuition requests yet.</p>
              <Button className="mt-4" onClick={() => navigate('/tuition-requests/new')}>
                Create a request
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && !error && requests.length > 0 && (
          <div className="space-y-4">
            {requests.map((r) => (
              <Card key={r.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">{r.subject}</CardTitle>
                      <CardDescription className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                        <span>£{r.budget}/hr</span>
                        <span>{r.mode.replace('_', '-')}</span>
                        <span className={r.status === 'ACTIVE' ? 'text-green-600' : 'text-muted-foreground'}>
                          {r.status}
                        </span>
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/tuition-requests/${r.id}`)}
                    >
                      See interested tutors
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-2">
                    {r.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TuitionRequestDetail() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!requestId) return;
    let cancelled = false;
    setLoading(true);
    getMyTuitionRequests()
      .then((data) => {
        const req = (data.requests || []).find((r) => r.id === requestId);
        if (!cancelled) setRequest(req || null);
        if (!req) return;
        return getInterestedTutorsForRequest(requestId);
      })
      .then((interestedData) => {
        if (cancelled || !interestedData) return;
        setTutors(interestedData.tutors || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [requestId]);

  if (!requestId) {
    navigate('/tuition-requests', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/tuition-requests')}>
            ← My requests
          </Button>
        </div>

        {loading && <p className="text-muted-foreground">Loading…</p>}
        {error && <p className="text-destructive">{error}</p>}

        {!loading && !error && request && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{request.subject}</CardTitle>
                <CardDescription>
                  £{request.budget}/hr · {request.mode.replace('_', '-')} · {request.status}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{request.description}</p>
              </CardContent>
            </Card>

            <h2 className="text-xl font-semibold mb-3">Tutors who expressed interest</h2>

            {tutors.length === 0 && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">No tutors have expressed interest yet.</p>
                </CardContent>
              </Card>
            )}

            {tutors.length > 0 && (
              <div className="space-y-4">
                {tutors.map((t) => (
                  <Card key={t.tutorId}>
                    <CardContent className="pt-6">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="font-medium">{t.name}</p>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            {t.rating > 0 ? (
                              <span className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                {Number(t.rating).toFixed(1)}
                              </span>
                            ) : (
                              <span>No reviews yet</span>
                            )}
                            <span>·</span>
                            <span>{Array.isArray(t.subjects) ? t.subjects.join(', ') : '—'}</span>
                          </div>
                        </div>
                        <Button asChild>
                          <Link to={`/tutors/${t.tutorId}`}>View profile & book</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {!loading && !error && !request && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Request not found.</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate('/tuition-requests')}>
                Back to my requests
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export { MyTuitionRequestsList, TuitionRequestDetail };
