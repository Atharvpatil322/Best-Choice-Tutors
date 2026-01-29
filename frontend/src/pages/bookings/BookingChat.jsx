/**
 * Booking Chat Page
 * Real-time chat for a booking. Visible only if user is learner or tutor for that booking.
 * Uses SocketContext; persists history via backend.
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSocket } from '@/contexts/SocketContext';
import { getCurrentRole } from '@/services/authService';

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
      }
      // Message is added via 'message' event from server
    });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const backHref = isTutor ? '/tutor/bookings' : '/bookings';

  if (!bookingId) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="container mx-auto max-w-2xl">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">Booking not found.</p>
              <div className="mt-4 flex justify-center">
                <Button variant="outline" onClick={() => navigate(backHref)}>
                  Back to Bookings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (joinError) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="container mx-auto max-w-2xl">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-destructive">{joinError}</p>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                Chat is only available for your bookings.
              </p>
              <div className="mt-4 flex justify-center">
                <Button variant="outline" onClick={() => navigate(backHref)}>
                  Back to Bookings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="container mx-auto max-w-2xl flex flex-col h-[calc(100vh-6rem)]">
        <Card className="flex flex-col flex-1 min-h-0">
          <CardHeader className="shrink-0 flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-lg">Chat</CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate(backHref)}>
              Back to Bookings
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 min-h-0 p-0">
            {!isConnected && (
              <div className="px-4 py-2 text-sm text-amber-700 bg-amber-50 border-b">
                Connecting…
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
              {messages.length === 0 && isConnected && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No messages yet. Say hello.
                </p>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col gap-0.5 max-w-[85%] ${
                    m.senderRole === (isTutor ? 'Tutor' : 'Learner')
                      ? 'ml-auto items-end'
                      : 'mr-auto items-start'
                  }`}
                >
                  <span className="text-xs font-medium text-muted-foreground">
                    {m.senderRole}
                  </span>
                  <div
                    className={`rounded-lg px-3 py-2 text-sm ${
                      m.senderRole === (isTutor ? 'Tutor' : 'Learner')
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {m.message}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(m.timestamp)}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form
              onSubmit={handleSend}
              className="shrink-0 flex gap-2 p-4 border-t bg-card"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message…"
                maxLength={5000}
                disabled={!isConnected || sending}
                className="flex-1"
              />
              <Button type="submit" disabled={!input.trim() || !isConnected || sending}>
                {sending ? 'Sending…' : 'Send'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default BookingChat;
