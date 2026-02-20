/**
 * Booking Chat Page
 * Real-time chat for a booking. Visible only if user is learner or tutor for that booking.
 * Styling aligned with dashboard (profile-page-content, #1A365D, rounded-2xl).
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare } from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';
import { getCurrentRole } from '@/services/authService';
import '../../styles/Profile.css';

function BookingChat() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { socket, isConnected, connect } = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [joinError, setJoinError] = useState(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const role = getCurrentRole();
  const isTutor = typeof role === 'string' && role.toLowerCase() === 'tutor';

  // Ensure socket connects when chat is opened
  useEffect(() => {
    if (!isConnected && connect) {
      connect();
    }
  }, [isConnected, connect]);

  // Join booking room and load history when socket is ready
  useEffect(() => {
    if (!socket?.connected || !bookingId) return;

    setJoinError(null);
    socket.emit('join_booking', { bookingId }, (res) => {
      if (res?.success) {
        socket.emit('get_history', { bookingId }, (hist) => {
          if (hist?.success && Array.isArray(hist.messages)) {
            setMessages(hist.messages);
          }
        });
      } else {
        setJoinError(res?.error || 'Could not join chat');
      }
    });
  }, [socket, bookingId, isConnected]);

  // Listen for new messages
  useEffect(() => {
    if (!socket) return;
    const onMessage = (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };
    socket.on('message', onMessage);
    return () => socket.off('message', onMessage);
  }, [socket]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !socket?.connected || !bookingId || sending) return;

    setSending(true);
    socket.emit('send_message', { bookingId, message: text }, (res) => {
      setSending(false);
      if (res?.success) {
        setInput('');
        // Ensure sent message appears even if socket 'message' event is missed
        if (res.message && typeof res.message === 'object') {
          const msg = res.message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, { id: msg.id, senderId: msg.senderId, senderRole: msg.senderRole, message: msg.message, timestamp: msg.timestamp }];
          });
        }
      }
    });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const backHref = isTutor ? '/tutor/bookings' : '/dashboard/bookings';

  if (!bookingId) {
    return (
      <div className="profile-page-content">
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Booking not found.</p>
            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={() => navigate(backHref)} className="rounded-lg">
                Back to Bookings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (joinError) {
    return (
      <div className="profile-page-content">
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardContent className="p-6">
            <p className="text-center text-destructive font-medium">{joinError}</p>
            <p className="mt-2 text-center text-sm text-slate-500">
              Chat is only available for your bookings.
            </p>
            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={() => navigate(backHref)} className="rounded-lg">
                Back to Bookings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="profile-page-content flex flex-col min-h-[calc(100vh-12rem)]">
      <div className="profile-intro flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A365D] flex items-center gap-2">
            <MessageSquare className="h-7 w-7" />
            Chat
          </h1>
          <p className="text-sm text-slate-500 mt-1">Booking conversation</p>
        </div>
        <Button variant="outline" onClick={() => navigate(backHref)} className="rounded-lg">
          Back to Bookings
        </Button>
      </div>

      <Card className="rounded-2xl border-gray-100 shadow-sm mt-6 flex flex-col flex-1 min-h-0 overflow-hidden">
        {!isConnected && (
          <div className="shrink-0 px-4 py-2.5 text-sm text-amber-800 bg-amber-50 border-b border-amber-100">
            Connecting…
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[240px]">
          {messages.length === 0 && isConnected && (
            <p className="text-center text-sm text-slate-500 py-8">
              No messages yet. Say hello.
            </p>
          )}
          {messages.map((m) => {
            const isOwn = m.senderRole === (isTutor ? 'Tutor' : 'Learner');
            return (
              <div
                key={m.id}
                className={`flex flex-col gap-1 max-w-[85%] ${isOwn ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                <span className="text-xs font-medium text-slate-500">{m.senderRole}</span>
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm ${
                    isOwn ? 'bg-[#1A365D] text-white' : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {m.message}
                </div>
                <span className="text-xs text-slate-400">{formatTime(m.timestamp)}</span>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        <form
          onSubmit={handleSend}
          className="shrink-0 flex gap-2 p-4 border-t border-slate-100 bg-slate-50/50"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message…"
            maxLength={5000}
            disabled={!isConnected || sending}
            className="flex-1 rounded-lg border-slate-200"
          />
          <Button
            type="submit"
            disabled={!input.trim() || !isConnected || sending}
            className="bg-[#1A365D] hover:bg-[#1A365D]/90 rounded-lg"
          >
            {sending ? 'Sending…' : 'Send'}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default BookingChat;
