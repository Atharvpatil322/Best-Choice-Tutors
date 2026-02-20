import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LifeBuoy } from 'lucide-react';
import { getSupportTickets } from '@/services/supportService';
import '../../styles/Profile.css';

const formatDateTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  return d.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const statusVariant = (status) => {
  switch (status) {
    case 'OPEN':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'CLOSED':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

function LearnerSupportTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        const data = await getSupportTickets();
        setTickets(data.tickets || []);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to load support tickets');
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  if (loading) {
    return (
      <div className="profile-page-content">
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Loading support tickets…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page-content">
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardContent className="p-6">
            <p className="text-center text-destructive font-medium">{error}</p>
            <div className="mt-4 flex justify-center gap-2">
              <Button variant="outline" onClick={() => navigate('/dashboard')} className="rounded-lg">
                Back to Dashboard
              </Button>
              <Button onClick={() => window.location.reload()} className="rounded-lg">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="profile-page-content">
      <div className="profile-intro flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A365D] flex items-center gap-2">
            <LifeBuoy className="h-7 w-7" />
            Support
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            View your support tickets or create a new one if you need help.
          </p>
        </div>
        <Button
          onClick={() => navigate('/dashboard/support/new')}
          className="bg-[#1A365D] hover:bg-[#1A365D]/90 rounded-lg"
        >
          New Ticket
        </Button>
      </div>

      <Card className="rounded-2xl border-gray-100 shadow-sm mt-6">
        <CardHeader>
          <CardTitle className="text-lg text-[#1A365D]">Your tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <p className="text-muted-foreground py-6">
              You haven&apos;t created any support tickets yet. Click <strong>New Ticket</strong> to
              contact support.
            </p>
          ) : (
            <ul className="space-y-3">
              {tickets.map((t) => (
                <li
                  key={t._id}
                  className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-gray-100 hover:bg-slate-50/60 transition-colors cursor-pointer"
                  onClick={() => navigate(`/dashboard/support/${t._id}`)}
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-[#1A365D] truncate max-w-[260px] sm:max-w-[360px]">
                      {t.subject}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Last updated: {formatDateTime(t.lastMessageAt || t.updatedAt || t.createdAt)}
                    </p>
                  </div>
                  <Badge
                    className={`border text-xs font-semibold px-3 py-1 rounded-full ${statusVariant(
                      t.status
                    )}`}
                  >
                    {t.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default LearnerSupportTickets;

