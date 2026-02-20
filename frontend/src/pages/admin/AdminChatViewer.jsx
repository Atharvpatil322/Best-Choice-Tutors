/**
 * Admin Chat Viewer
 * Browse conversations and view chat messages read-only.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCurrentRole, getStoredUser } from '@/services/authService';
import { getConversations, getBookingMessages } from '@/services/adminService';
import '../../styles/Profile.css';

function AdminChatViewer() {
  const navigate = useNavigate();
  const role = getCurrentRole();
  const isAdmin = typeof role === 'string' && role === 'Admin';

  const [conversations, setConversations] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState(null);

  // Load conversations list on mount
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getConversations();
        setConversations(result.conversations || []);
      } catch (err) {
        setError(err.message || 'Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchConversations();
    }
  }, [isAdmin]);

  // Load messages when a conversation is selected
  useEffect(() => {
    if (!selectedBookingId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        setLoadingMessages(true);
        setError(null);
        const result = await getBookingMessages(selectedBookingId);
        setMessages(result.messages || []);
      } catch (err) {
        setError(err.message || 'Failed to load messages');
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [selectedBookingId]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '—';
    return new Date(timestamp).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const [year, month, day] = dateStr.split('-');
      return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatTimeOnly = (timeStr) => {
    if (!timeStr) return '—';
    return timeStr;
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

  const selectedConversation = conversations.find((c) => c.bookingId === selectedBookingId);

  return (
    <div className="profile-page-content">
      <div className="profile-intro">
        <h1 className="text-2xl font-bold text-[#1A365D] flex items-center gap-2">
          <MessageSquare className="h-7 w-7" />
          Chat Viewer
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Browse conversations happening on the platform (read-only).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-6 mt-6">
        {/* Conversation List Panel */}
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-[#1A365D]">Conversations</CardTitle>
            <CardDescription>
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-6">Loading conversations…</p>
            ) : error && !selectedBookingId ? (
              <div className="space-y-3">
                <p className="text-sm text-destructive">{error}</p>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="w-full rounded-lg"
                >
                  Retry
                </Button>
              </div>
            ) : conversations.length === 0 ? (
              <p className="text-muted-foreground py-6">
                No conversations found. Conversations will appear here once learners and tutors start
                chatting.
              </p>
            ) : (
              <ul className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {conversations.map((conv) => (
                  <li
                    key={conv.bookingId}
                    onClick={() => setSelectedBookingId(conv.bookingId)}
                    className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                      selectedBookingId === conv.bookingId
                        ? 'border-[#1A365D] bg-[#1A365D]/5'
                        : 'border-gray-100 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm text-[#1A365D] truncate">
                            {conv.learnerName} ↔ {conv.tutorName}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {formatDate(conv.date)} · {formatTimeOnly(conv.startTime)} - {formatTimeOnly(conv.endTime)}
                          </p>
                        </div>
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          {conv.messageCount} msg{conv.messageCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {conv.lastMessageAt && (
                        <p className="text-[10px] text-slate-400">
                          Last: {formatTime(conv.lastMessageAt)}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Chat Detail Panel */}
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-[#1A365D]">
              {selectedConversation
                ? `Chat: ${selectedConversation.learnerName} ↔ ${selectedConversation.tutorName}`
                : 'Select a conversation'}
            </CardTitle>
            <CardDescription>
              {selectedConversation
                ? `Booking ${selectedConversation.bookingId} · ${formatDate(selectedConversation.date)} · ${messages.length} message${messages.length !== 1 ? 's' : ''}`
                : 'Click on a conversation from the list to view messages'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedBookingId ? (
              <p className="text-muted-foreground py-6 text-center">
                Select a conversation from the list to view messages.
              </p>
            ) : loadingMessages ? (
              <p className="text-center text-muted-foreground py-6">Loading messages…</p>
            ) : error ? (
              <div className="space-y-3">
                <p className="text-sm text-destructive">{error}</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setError(null);
                    setSelectedBookingId(selectedBookingId);
                  }}
                  className="w-full rounded-lg"
                >
                  Retry
                </Button>
              </div>
            ) : messages.length === 0 ? (
              <p className="text-muted-foreground py-6">
                No messages found for this conversation.
              </p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span
                        className={`text-xs font-medium ${
                          m.senderRole === 'Learner' ? 'text-blue-700' : 'text-emerald-700'
                        }`}
                      >
                        {m.senderRole ?? '—'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(m.timestamp)}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm">{m.message || '—'}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AdminChatViewer;
