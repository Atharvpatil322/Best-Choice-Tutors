/**
 * Admin: Support ticket queue
 * Filterable by status; shows basic ticket info and links to detail view.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LifeBuoy } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { getCurrentRole, getStoredUser } from '@/services/authService';
import { getSupportTicketsQueue } from '@/services/adminService';
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

function AdminSupportTickets() {
  const navigate = useNavigate();
  const role = getCurrentRole();
  const isAdmin = typeof role === 'string' && role === 'Admin';

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    const fetchTickets = async () => {
      try {
        setLoading(true);
        setError(null);
        const params =
          statusFilter === 'ALL'
            ? {}
            : { status: /** @type {'OPEN'|'IN_PROGRESS'|'CLOSED'} */ (statusFilter) };
        const data = await getSupportTicketsQueue(params);
        setTickets(data.tickets || []);
      } catch (err) {
        setError(err.message || 'Failed to load support tickets');
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [isAdmin, statusFilter]);

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
            <p className="text-center text-muted-foreground">Loading support tickets…</p>
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
            Support Tickets
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            View and manage learner and tutor support tickets.
          </p>
        </div>
      </div>

      <Card className="rounded-2xl border-gray-100 shadow-sm mt-6">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-[#1A365D]">Queue</CardTitle>
            <CardDescription>Filter by status and open a ticket to reply.</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">Status</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In progress</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-destructive">{error}</p>
          ) : tickets.length === 0 ? (
            <p className="text-muted-foreground">No support tickets found for this filter.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-input text-xs text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">User</th>
                    <th className="px-3 py-2 text-left font-medium">Role</th>
                    <th className="px-3 py-2 text-left font-medium">Subject</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                    <th className="px-3 py-2 text-left font-medium">Last updated</th>
                    <th className="px-3 py-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr
                      key={t._id}
                      className="border-b border-input last:border-0 hover:bg-muted/40"
                    >
                      <td className="px-3 py-2 whitespace-nowrap text-slate-800">
                        {t.createdByUserId?.name || 'User'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-600">
                        {t.createdByRole || '—'}
                      </td>
                      <td className="px-3 py-2 max-w-xs">
                        <span className="truncate block">{t.subject}</span>
                      </td>
                      <td className="px-3 py-2">
                        <Badge
                          className={`border text-xs font-semibold px-3 py-1 rounded-full ${statusBadgeClass(
                            t.status
                          )}`}
                        >
                          {t.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-600">
                        {formatDateTime(t.lastMessageAt || t.updatedAt || t.createdAt)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg"
                          onClick={() => navigate(`/admin/support/${t._id}`)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminSupportTickets;

