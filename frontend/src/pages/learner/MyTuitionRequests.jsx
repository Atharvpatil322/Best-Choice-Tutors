/**
 * My Tuition Requests (Learner)
 * Phase 9: List learner's tuition requests; view interested tutors per request; proceed to booking flow (no chat).
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Star } from 'lucide-react';
import { getMyTuitionRequests, getInterestedTutorsForRequest, withdrawTuitionRequest } from '@/services/tuitionRequestService';
import { Plus, ChevronRight, PoundSterling, Video, MessageSquare, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import ProfilePic from '../../images/ProfilePic.png';

function MyTuitionRequestsList() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [withdrawId, setWithdrawId] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);

  const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
    <div className="w-12 h-12 border-4 border-slate-200 border-t-[#1A365D] rounded-full animate-spin"></div>
    <p className="text-slate-500 font-medium animate-pulse">Loading your data...</p>
  </div>
);

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

  const handleWithdrawConfirm = async () => {
    if (!withdrawId) return;
    setWithdrawing(true);
    try {
      await withdrawTuitionRequest(withdrawId);
      setRequests((prev) =>
        prev.map((r) => (r.id === withdrawId ? { ...r, status: 'CLOSED' } : r))
      );
      toast.success('Tuition request has been withdrawn.');
      setWithdrawId(null);
    } catch (err) {
      toast.error(err.message || 'Could not withdraw request. Please try again.');
    } finally {
      setWithdrawing(false);
    }
  };

  const activeRequests = requests.filter((r) => r.status === 'ACTIVE');
  const closedRequests = requests.filter((r) => r.status === 'CLOSED');

  if (loading) return <PageLoader />;
return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1A365D]">My tuition requests</h1>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/dashboard')} className="rounded-xl border-slate-200">Dashboard</Button>
          <Button onClick={() => navigate('/dashboard/tuition-requests/new')} className="bg-[#3B82F6] hover:bg-blue-600 text-white rounded-xl px-6">
            <Plus size={18} className="mr-2" /> New request
          </Button>
        </div>
      </div>

      {activeRequests.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-[#1A365D]">Active requests</h2>
          <div className="space-y-4">
            {activeRequests.map((r) => (
              <Card key={r.id} className="border-slate-100 shadow-sm rounded-2xl overflow-hidden hover:border-slate-200 transition-all">
                <CardContent className="p-6 flex flex-col md:flex-row justify-between items-start gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-[#1A365D]">
                        {(r.subjects && r.subjects.length > 0) ? r.subjects.join(', ') : r.subject || '—'}
                      </h3>
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600">
                        {r.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-400 font-medium mb-4">
                      <span className="flex items-center gap-1.5"><PoundSterling size={14}/> £{r.budget}/hr</span>
                      <span className="flex items-center gap-1.5 uppercase"><Video size={14}/> {r.mode.replace('_', ' ')}</span>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2 max-w-2xl">{r.description}</p>
                  </div>
                  <div className="w-full md:w-auto flex flex-col gap-2">
                    <Button
                      variant="outline"
                      className="w-full border-slate-200 text-[#1A365D] font-bold h-11 px-6 rounded-xl hover:bg-slate-50"
                      onClick={() => navigate(`/dashboard/tuition-requests/${r.id}`)}
                    >
                      See interested tutors <ChevronRight size={16} className="ml-2" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 h-10 rounded-xl"
                      onClick={() => setWithdrawId(r.id)}
                    >
                      <Trash2 size={14} className="mr-2" /> Withdraw request
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {closedRequests.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-[#1A365D]">Past / Closed requests</h2>
          <div className="space-y-4">
            {closedRequests.map((r) => (
              <Card key={r.id} className="border-slate-100 shadow-sm rounded-2xl overflow-hidden opacity-90">
                <CardContent className="p-6 flex flex-col md:flex-row justify-between items-start gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-[#1A365D]">
                        {(r.subjects && r.subjects.length > 0) ? r.subjects.join(', ') : r.subject || '—'}
                      </h3>
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-50 text-slate-500">
                        {r.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-400 font-medium mb-4">
                      <span className="flex items-center gap-1.5"><PoundSterling size={14}/> £{r.budget}/hr</span>
                      <span className="flex items-center gap-1.5 uppercase"><Video size={14}/> {r.mode.replace('_', ' ')}</span>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2 max-w-2xl">{r.description}</p>
                  </div>
                  <div className="w-full md:w-auto">
                    <Button
                      variant="outline"
                      className="w-full border-slate-200 text-slate-500 font-bold h-11 px-6 rounded-xl"
                      onClick={() => navigate(`/dashboard/tuition-requests/${r.id}`)}
                    >
                      View details <ChevronRight size={16} className="ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {requests.length === 0 && (
        <Card className="border-slate-100 rounded-2xl">
          <CardContent className="p-8 text-center text-slate-500">
            You have no tuition requests yet. Create one to get started.
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!withdrawId} onOpenChange={(open) => !open && setWithdrawId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw this request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will close your tuition request. Tutors will no longer see it. Existing interests will be kept but cannot be acted on. You can create a new request anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={withdrawing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleWithdrawConfirm}
              disabled={withdrawing}
              className="bg-red-600 hover:bg-red-700"
            >
              {withdrawing ? 'Withdrawing…' : 'Withdraw request'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
    <div className="w-12 h-12 border-4 border-slate-200 border-t-[#1A365D] rounded-full animate-spin"></div>
    <p className="text-slate-500 font-medium animate-pulse">Loading your data...</p>
  </div>
);

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
    navigate('/dashboard/tuition-requests', { replace: true });
    return null;
  }

  const handleWithdrawConfirm = async () => {
    if (!requestId || !request) return;
    setWithdrawing(true);
    try {
      await withdrawTuitionRequest(requestId);
      setRequest((prev) => (prev ? { ...prev, status: 'CLOSED' } : null));
      toast.success('Tuition request has been withdrawn.');
      setShowWithdrawDialog(false);
    } catch (err) {
      toast.error(err.message || 'Could not withdraw request. Please try again.');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) return <PageLoader />;

 return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/dashboard/tuition-requests')} className="text-slate-500 hover:text-[#1A365D]">
        ← Back to my requests
      </Button>

      {request && (
        <Card className="bg-[#1A365D] text-white rounded-[24px] p-8 border-none">
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                {(request.subjects && request.subjects.length > 0) ? request.subjects.join(', ') : request.subject}
              </h2>
              <p className="flex items-center gap-4 text-white/70 font-medium">
                <span>£{request.budget}/hr</span>
                <span>•</span>
                <span>{request.mode.replace('_', ' ')}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-white/10 px-4 py-1 rounded-full text-xs font-bold uppercase">{request.status}</span>
              {request.status === 'ACTIVE' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-400 bg-red-600 text-white hover:bg-red-700 hover:border-red-500 font-semibold text-sm rounded-xl"
                  onClick={() => setShowWithdrawDialog(true)}
                >
                  <Trash2 size={14} className="mr-2" /> Withdraw request
                </Button>
              )}
            </div>
          </div>
          <p className="mt-6 text-white/80 max-w-3xl leading-relaxed">{request.description}</p>
        </Card>
      )}

      <h3 className="text-lg font-bold text-[#1A365D] mt-8">Tutors who expressed interest ({tutors.length})</h3>
      
      <div className="grid gap-4">
        {tutors.map((t) => (
          <Card key={t.tutorId} className="border-slate-100 hover:border-slate-200 transition-all rounded-2xl shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-slate-100 overflow-hidden shrink-0">
                  <img src={t.profilePhoto || ProfilePic} className="w-full h-full object-cover" alt="" />
                </div>
                <div>
                  <p className="font-bold text-[#1A365D] text-lg">{t.name}</p>
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <span className="flex items-center gap-1"><Star size={14} className="fill-amber-400 text-amber-400" /> {Number(t.rating).toFixed(1)}</span>
                    <span>•</span>
                    <span className="truncate max-w-[200px]">{t.subjects?.join(', ')}</span>
                  </div>
                </div>
              </div>
              <Button asChild className="bg-[#1A365D] text-white px-6 rounded-xl font-bold h-11">
                <Link
                  to={`/dashboard/tutors/${t.tutorId}?fromRequest=${requestId}&fromRequestBudget=${request?.budget ?? ''}`}
                >
                  View Profile & Book
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw this request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will close your tuition request. Tutors will no longer see it. Existing interests will be kept but cannot be acted on. You can create a new request anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={withdrawing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleWithdrawConfirm}
              disabled={withdrawing}
              className="bg-red-600 hover:bg-red-700"
            >
              {withdrawing ? 'Withdrawing…' : 'Withdraw request'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export { MyTuitionRequestsList, TuitionRequestDetail };
