/**
 * Admin: Send push notification to all learners and tutors.
 * Uses the same Notification model; no socket. Users see it in their notification bell.
 */

import { useState } from 'react';
import { Megaphone } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getCurrentRole } from '@/services/authService';
import { broadcastNotification } from '@/services/adminService';

function AdminNotifications() {
  const role = getCurrentRole();
  const isAdmin = typeof role === 'string' && role === 'Admin';

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const t = title.trim();
    const m = message.trim();
    if (!t || !m) {
      setError('Both title and message are required.');
      return;
    }
    setSending(true);
    try {
      const result = await broadcastNotification({ title: t, message: m });
      setSuccess(
        result.count !== undefined
          ? `Notification sent to ${result.count} user(s).`
          : 'Notification sent.'
      );
      setTitle('');
      setMessage('');
    } catch (err) {
      setError(err.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <p className="text-destructive font-medium">Access denied. Admin only.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl">
      <Card className="rounded-2xl border-gray-100 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-amber-600" />
            <CardTitle className="text-[#1A365D]">Broadcast notification</CardTitle>
          </div>
          <CardDescription>
            Send a notification to all learners and tutors. They will see it in their notification bell when they next open the dashboard. Notifications expire automatically after 30 days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Platform maintenance"
                maxLength={200}
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. We will be performing maintenance on Sunday 10:00–12:00. Services may be briefly unavailable."
                rows={4}
                className="rounded-lg resize-none"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            {success && (
              <p className="text-sm text-green-600 font-medium">{success}</p>
            )}
            <Button
              type="submit"
              disabled={sending || !title.trim() || !message.trim()}
              className="bg-[#1A365D] hover:bg-[#1A365D]/90 rounded-lg"
            >
              {sending ? 'Sending…' : 'Send to all users'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminNotifications;
