/**
 * Admin: Disputes list
 * List of disputes for review. Links to detail page for resolution.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCurrentRole, getStoredUser } from '@/services/authService';
import { getDisputes } from '@/services/adminService';
import '../../styles/Profile.css';

function AdminDisputes() {
  const navigate = useNavigate();
  const role = getCurrentRole();
  const isAdmin = typeof role === 'string' && role === 'Admin';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [disputes, setDisputes] = useState([]);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    const fetchDisputes = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getDisputes();
        setDisputes(data.disputes || []);
      } catch (err) {
        setError(err.message || 'Failed to load disputes');
        setDisputes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDisputes();
  }, [isAdmin]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (start, end) => {
    if (!start || !end) return '—';
    const fmt = (t) => {
      const [h, m] = (t || '').split(':');
      const hour = parseInt(h, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${m || '00'} ${ampm}`;
    };
    return `${fmt(start)} – ${fmt(end)}`;
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
            <p className="text-center text-muted-foreground">Loading disputes…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const openDisputes = disputes.filter((d) => d.status === 'OPEN');
  const resolvedDisputes = disputes.filter((d) => d.status === 'RESOLVED');

  return (
    <div className="profile-page-content">
      <div className="profile-intro">
        <h1 className="text-2xl font-bold text-[#1A365D] flex items-center gap-2">
          <AlertCircle className="h-7 w-7" />
          Dispute Management
        </h1>
        <p className="text-sm text-slate-500 mt-1">Review and resolve disputes. Open disputes require admin action.</p>
      </div>

      <Card className="rounded-2xl border-gray-100 shadow-sm mt-6">
        <CardHeader>
          <CardTitle className="text-[#1A365D]">Disputes</CardTitle>
          <CardDescription>
            Open disputes require admin action.
          </CardDescription>
        </CardHeader>
          <CardContent>
            {error ? (
              <p className="text-destructive">{error}</p>
            ) : disputes.length === 0 ? (
              <p className="text-muted-foreground">No disputes.</p>
            ) : (
              <div className="space-y-8">
                {openDisputes.length > 0 && (
                  <div>
                    <h2 className="mb-3 flex items-center gap-2 font-semibold text-amber-800">
                      <AlertCircle className="h-4 w-4" />
                      Open ({openDisputes.length})
                    </h2>
                    <ul className="space-y-3">
                      {openDisputes.map((d) => (
                        <li
                          key={d.id}
                          className="flex cursor-pointer items-center justify-between rounded-lg border border-amber-200 bg-amber-50/50 p-4 transition-colors hover:bg-amber-50"
                          onClick={() => navigate(`/admin/disputes/${d.id}`)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              navigate(`/admin/disputes/${d.id}`);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <div>
                            <p className="font-medium">
                              {d.learnerName} vs {d.tutorName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(d.date)} · {formatTime(d.startTime, d.endTime)}
                            </p>
                          </div>
                          <Button size="sm" variant="outline">
                            Review & resolve
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {resolvedDisputes.length > 0 && (
                  <div>
                    <h2 className="mb-3 font-semibold text-muted-foreground">Resolved ({resolvedDisputes.length})</h2>
                    <ul className="space-y-3">
                      {resolvedDisputes.map((d) => (
                        <li
                          key={d.id}
                          className="flex cursor-pointer items-center justify-between rounded-lg border border-input p-4 transition-colors hover:bg-muted/50"
                          onClick={() => navigate(`/admin/disputes/${d.id}`)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              navigate(`/admin/disputes/${d.id}`);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <div>
                            <p className="font-medium">
                              {d.learnerName} vs {d.tutorName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(d.date)} · {formatTime(d.startTime, d.endTime)}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground">View</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}

export default AdminDisputes;
