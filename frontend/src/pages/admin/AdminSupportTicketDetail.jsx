/**
 * Admin: Support ticket detail
 * Full thread + admin reply + status controls (IN_PROGRESS / CLOSED).
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LifeBuoy } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { getCurrentRole, getStoredUser } from '@/services/authService';
import {
  getSupportTicketAdmin,
  replyToSupportTicketAdmin,
  updateSupportTicketStatusAdmin,
} from '@/services/adminService';
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

const statusBadgeClass = (status) => {
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

function AdminSupportTicketDetail() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const role = getCurrentRole();
  const isAdmin = typeof role === 'string' && role === 'Admin';

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getSupportTicketAdmin(ticketId);
        setTicket(data.ticket);
      } catch (err) {
        setError(err.message || 'Failed to load support ticket');
        setTicket(null);
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchTicket();
    } else {
      setLoading(false);
    }
  }, [isAdmin, ticketId]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim() || !ticket) return;
    if (ticket.status === 'CLOSED') return;

    try {
      setSending(true);
      setError(null);
      const { ticket: updated } = await replyToSupportTicketAdmin(ticket._id, {
        message: reply.trim(),
      });
      setTicket(updated);
      setReply('');
    } catch (err) {
      setError(err.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (nextStatus) => {
    if (!ticket || ticket.status === nextStatus) return;
    try {
      setUpdatingStatus(true);
      setError(null);
      const { ticket: updated } = await updateSupportTicketStatusAdmin(ticket._id, {
        status: nextStatus,
      });
      setTicket(updated);
    } catch (err) {
      setError(err.message || 'Failed to update ticket status');
    } finally {
      setUpdatingStatus(false);
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
            <p className="text-center text-muted-foreground">Loading ticket…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="space-y-6">
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardContent className="p-6">
            <p className="text-center text-destructive font-medium">
              {error || 'Ticket not found'}
            </p>
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                onClick={() => navigate('/admin/support')}
                className="rounded-lg"
              >
                Back to Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const messages = ticket.messages || [];
  const isClosed = ticket.status === 'CLOSED';

  return (
    <div className="profile-page-content">
      <div className="profile-intro flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-[#1A365D] flex items-center gap-2">
            <LifeBuoy className="h-7 w-7" />
            <span className="truncate">{ticket.subject}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            From: {ticket.createdByUserId?.name || 'User'} ({ticket.createdByRole || '—'}) · Created:{' '}
            {formatDateTime(ticket.createdAt)} · Last updated:{' '}
            {formatDateTime(ticket.lastMessageAt || ticket.updatedAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge
            className={`border text-xs font-semibold px-3 py-1 rounded-full ${statusBadgeClass(
              ticket.status
            )}`}
          >
            {ticket.status}
          </Badge>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={ticket.status === 'IN_PROGRESS' ? 'default' : 'outline'}
              className="rounded-lg"
              disabled={updatingStatus || ticket.status === 'IN_PROGRESS'}
              onClick={() => handleStatusChange('IN_PROGRESS')}
            >
              Mark in progress
            </Button>
            <Button
              size="sm"
              variant={ticket.status === 'CLOSED' ? 'default' : 'outline'}
              className="rounded-lg"
              disabled={updatingStatus || ticket.status === 'CLOSED'}
              onClick={() => handleStatusChange('CLOSED')}
            >
              Mark closed
            </Button>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="rounded-lg"
            onClick={() => navigate('/admin/support')}
          >
            Back to queue
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6 mt-6">
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-[#1A365D]">Conversation</CardTitle>
            <CardDescription>All messages for this support ticket.</CardDescription>
          </CardHeader>
          <CardContent>
            {messages.length === 0 ? (
              <p className="text-muted-foreground py-4">No messages yet.</p>
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {messages.map((m) => (
                  <div
                    key={m._id}
                    className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="font-semibold text-slate-700 text-xs">
                        {m.senderRole === 'ADMIN'
                          ? 'Support'
                          : `${ticket.createdByRole ?? 'User'}`}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDateTime(m.createdAt)}
                      </span>
                    </div>
                    <p className="text-slate-800 whitespace-pre-wrap break-words">{m.message}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-100 shadow-sm h-fit">
          <CardHeader>
            <CardTitle className="text-lg text-[#1A365D]">Admin reply</CardTitle>
            <CardDescription>
              Replies are visible to the learner or tutor on their dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isClosed ? (
              <p className="text-sm text-slate-500">
                This ticket is <strong>closed</strong>. You may still change the status back to{' '}
                <strong>IN_PROGRESS</strong> if you need to reopen the conversation.
              </p>
            ) : (
              <form className="space-y-3" onSubmit={handleReply}>
                <Textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type your reply to the user…"
                  rows={5}
                  disabled={sending}
                />
                <Button
                  type="submit"
                  disabled={sending || !reply.trim()}
                  className="bg-[#1A365D] hover:bg-[#1A365D]/90 rounded-lg w-full"
                >
                  {sending ? 'Sending…' : 'Send reply'}
                </Button>
              </form>
            )}
            {error && (
              <p className="mt-3 text-sm text-destructive">
                {error}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AdminSupportTicketDetail;

