import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import { LifeBuoy } from 'lucide-react';
import { getSupportTicketById, replyToSupportTicket, deleteSupportTicket } from '@/services/supportService';
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

function LearnerSupportTicketDetail() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        setLoading(true);
        const data = await getSupportTicketById(ticketId);
        setTicket(data.ticket);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to load support ticket');
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [ticketId]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    if (!ticket || ticket.status === 'CLOSED') return;

    try {
      setSending(true);
      const { ticket: updated } = await replyToSupportTicket(ticket._id, {
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

  const handleDeleteTicket = async () => {
    if (!ticket) return;

    try {
      setDeleting(true);
      await deleteSupportTicket(ticket._id);
      navigate('/dashboard/support');
    } catch (err) {
      setError(err.message || 'Failed to delete ticket');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page-content">
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
      <div className="profile-page-content">
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardContent className="p-6">
            <p className="text-center text-destructive font-medium">
              {error || 'Ticket not found'}
            </p>
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard/support')}
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

  const isClosed = ticket.status === 'CLOSED';
  const messages = ticket.messages || [];

  return (
    <div className="profile-page-content">
      <div className="profile-intro flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-[#1A365D] flex items-center gap-2">
            <LifeBuoy className="h-7 w-7" />
            <span className="truncate">{ticket.subject}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Created: {formatDateTime(ticket.createdAt)} · Last updated:{' '}
            {formatDateTime(ticket.lastMessageAt || ticket.updatedAt)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            className={`border text-xs font-semibold px-3 py-1 rounded-full ${statusVariant(
              ticket.status
            )}`}
          >
            {ticket.status}
          </Badge>
          <Button
            variant="outline"
            className="rounded-lg"
            onClick={() => navigate('/dashboard/support')}
          >
            Back to tickets
          </Button>
          <Button
            variant="destructive"
            className="rounded-lg"
            onClick={() => setShowDeleteDialog(true)}
            disabled={deleting}
          >
            {deleting ? 'Deleting…' : 'Delete ticket'}
          </Button>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Support Ticket</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this support ticket? This action cannot be undone.
              All messages and conversation history will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="rounded-lg">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTicket}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6 mt-6">
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-[#1A365D]">Conversation</CardTitle>
          </CardHeader>
          <CardContent>
            {messages.length === 0 ? (
              <p className="text-muted-foreground py-4">No messages yet.</p>
            ) : (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {messages.map((m) => (
                  <div
                    key={m._id}
                    className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="font-semibold text-slate-700 text-xs">
                        {m.senderRole === 'ADMIN' ? 'Support' : 'You'}
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
            <CardTitle className="text-lg text-[#1A365D]">
              {isClosed ? 'Ticket closed' : 'Reply'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isClosed ? (
              <p className="text-sm text-slate-500">
                This ticket has been marked as <strong>closed</strong>. You can still read the
                conversation, but new replies are disabled. If you need more help, please create a
                new ticket.
              </p>
            ) : (
              <form className="space-y-3" onSubmit={handleSendReply}>
                <Textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type your reply to support…"
                  rows={4}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default LearnerSupportTicketDetail;

