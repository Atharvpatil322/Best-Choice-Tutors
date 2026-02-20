import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { LifeBuoy } from 'lucide-react';
import { createSupportTicket } from '@/services/supportService';
import '../../styles/Profile.css';

function LearnerCreateSupportTicket() {
  const navigate = useNavigate();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setError('Subject and message are required');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const { ticket } = await createSupportTicket({
        subject: subject.trim(),
        message: message.trim(),
      });
      navigate(`/dashboard/support/${ticket._id}`);
    } catch (err) {
      setError(err.message || 'Failed to create support ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="profile-page-content">
      <div className="profile-intro flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A365D] flex items-center gap-2">
            <LifeBuoy className="h-7 w-7" />
            New Support Ticket
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tell us what you need help with and our team will respond in this thread.
          </p>
        </div>
      </div>

      <Card className="rounded-2xl border-gray-100 shadow-sm mt-6">
        <CardHeader>
          <CardTitle className="text-lg text-[#1A365D]">Ticket details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4 max-w-2xl" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="subject">
                Subject
              </label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your issue"
                maxLength={200}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="message">
                Message
              </label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe what you need help with. Include any relevant booking details."
                rows={6}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="submit"
                disabled={submitting}
                className="bg-[#1A365D] hover:bg-[#1A365D]/90 rounded-lg"
              >
                {submitting ? 'Creating…' : 'Create ticket'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-lg"
                onClick={() => navigate('/dashboard/support')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default LearnerCreateSupportTicket;

