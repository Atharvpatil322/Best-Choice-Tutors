/**
 * Admin Audit Log
 * Display admin actions, entity affected, timestamp.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCurrentRole, getStoredUser } from '@/services/authService';
import { getAuditLog } from '@/services/adminService';
import '../../styles/Profile.css';

const ACTION_LABELS = {
  USER_SUSPENDED: 'User suspended',
  USER_BANNED: 'User banned',
  USER_ACTIVATED: 'User activated',
  TUTOR_APPROVED: 'Tutor approved',
  TUTOR_REJECTED: 'Tutor rejected',
  DISPUTE_RESOLVED: 'Dispute resolved',
  CONFIG_UPDATED: 'Config updated',
};

function AdminAuditLog() {
  const navigate = useNavigate();
  const role = getCurrentRole();
  const isAdmin = typeof role === 'string' && role === 'Admin';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    const fetchLog = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAuditLog({ limit: 200 });
        setEntries(data.entries || []);
      } catch (err) {
        setError(err.message || 'Failed to load audit log');
        setEntries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLog();
  }, [isAdmin]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '—';
    return new Date(timestamp).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionLabel = (action) => ACTION_LABELS[action] ?? action ?? '—';

  const getEntityLabel = (entry) => {
    const type = entry.entityType ?? '—';
    const id = entry.entityId ?? '—';
    return `${type} (${id})`;
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
            <p className="text-center text-muted-foreground">Loading audit log…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="profile-page-content">
      <div className="profile-intro">
        <h1 className="text-2xl font-bold text-[#1A365D] flex items-center gap-2">
          <ClipboardList className="h-7 w-7" />
          Audit Log
        </h1>
        <p className="text-sm text-slate-500 mt-1">Admin actions: user status, tutor verification, dispute resolution, config changes.</p>
      </div>

      <Card className="rounded-2xl border-gray-100 shadow-sm mt-6">
        <CardHeader>
            <CardTitle className="text-[#1A365D]">Admin actions</CardTitle>
            <CardDescription>
              Centralized log of admin actions: user status, tutor verification, dispute resolution, config changes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <p className="mb-4 text-sm text-destructive">{error}</p>
            )}
            {entries.length === 0 ? (
              <p className="text-muted-foreground">No audit log entries.</p>
            ) : (
              <div className="overflow-x-auto rounded-md border border-input">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-input bg-muted/50">
                      <th className="px-4 py-3 font-medium">Action</th>
                      <th className="px-4 py-3 font-medium">Entity affected</th>
                      <th className="px-4 py-3 font-medium">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((e) => (
                      <tr
                        key={e.id}
                        className="border-b border-input last:border-0 hover:bg-muted/30"
                      >
                        <td className="px-4 py-3 font-medium">
                          {getActionLabel(e.action)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                          {getEntityLabel(e)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {formatTime(e.createdAt)}
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

export default AdminAuditLog;
