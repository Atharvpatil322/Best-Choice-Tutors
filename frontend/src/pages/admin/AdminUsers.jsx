/**
 * Admin Users
 * List learners and tutors with status (ACTIVE/SUSPENDED/BANNED).
 * Buttons to suspend, ban, activate.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserX, UserCheck, Ban } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getCurrentRole, getStoredUser } from '@/services/authService';
import {
  getUsers,
  suspendUser as apiSuspendUser,
  banUser as apiBanUser,
  activateUser as apiActivateUser,
} from '@/services/adminService';
import '../../styles/Profile.css';

const ROLE_FILTER_OPTIONS = [
  { value: 'all', label: 'All users' },
  { value: 'Learner', label: 'Learners' },
  { value: 'Tutor', label: 'Tutors' },
];

function AdminUsers() {
  const navigate = useNavigate();
  const currentUser = getStoredUser();
  const role = getCurrentRole();
  const isAdmin = typeof role === 'string' && role === 'Admin';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('all');
  const [emailFilter, setEmailFilter] = useState('');
  const [actingId, setActingId] = useState(null);

  const filteredUsers = emailFilter.trim()
    ? users.filter((u) =>
        (u.email || '')
          .toLowerCase()
          .includes(emailFilter.trim().toLowerCase())
      )
    : users;

  const fetchUsers = async () => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      setError(null);
      const params = roleFilter && roleFilter !== 'all' ? { role: roleFilter } : {};
      const data = await getUsers(params);
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    fetchUsers();
  }, [isAdmin, roleFilter]);

  const handleSuspend = async (userId) => {
    setActingId(userId);
    try {
      await apiSuspendUser(userId);
      await fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to suspend user');
    } finally {
      setActingId(null);
    }
  };

  const handleBan = async (userId) => {
    setActingId(userId);
    try {
      await apiBanUser(userId);
      await fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to ban user');
    } finally {
      setActingId(null);
    }
  };

  const handleActivate = async (userId) => {
    setActingId(userId);
    try {
      await apiActivateUser(userId);
      await fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to activate user');
    } finally {
      setActingId(null);
    }
  };

  const isCurrentUser = (userId) => currentUser?.id === userId;

  if (!currentUser) {
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

  if (loading && users.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Loading users…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'SUSPENDED':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'BANNED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-muted text-muted-foreground border-input';
    }
  };

  return (
    <div className="profile-page-content">
      <div className="profile-intro">
        <h1 className="text-2xl font-bold text-[#1A365D] flex items-center gap-2">
          <Users className="h-7 w-7" />
          User Management
        </h1>
        <p className="text-sm text-slate-500 mt-1">List learners and tutors. Suspend, ban, or activate accounts.</p>
      </div>

      <Card className="rounded-2xl border-gray-100 shadow-sm mt-6">
        <CardHeader>
          <CardTitle className="text-[#1A365D]">Users</CardTitle>
          <CardDescription>
              You cannot change your own status.
            </CardDescription>
            <div className="flex flex-wrap items-end gap-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="roleFilter" className="text-xs">Role</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger id="roleFilter" className="w-[180px]">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_FILTER_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="emailFilter" className="text-xs">Email</Label>
                <Input
                  id="emailFilter"
                  type="text"
                  placeholder="Filter by email..."
                  value={emailFilter}
                  onChange={(e) => setEmailFilter(e.target.value)}
                  className="w-[220px]"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <p className="mb-4 text-sm text-destructive">{error}</p>
            )}
            {users.length === 0 ? (
              <p className="text-muted-foreground">No users found.</p>
            ) : filteredUsers.length === 0 ? (
              <p className="text-muted-foreground">No users match the email filter.</p>
            ) : (
              <div className="overflow-x-auto rounded-md border border-input">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-input bg-muted/50">
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Role</th>
                      <th className="px-4 py-3 font-medium">Gender</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => {
                      const status = u.status ?? 'ACTIVE';
                      const isSelf = isCurrentUser(u.id);
                      const busy = actingId === u.id;
                      return (
                        <tr
                          key={u.id}
                          className="border-b border-input last:border-0 hover:bg-muted/30"
                        >
                          <td className="px-4 py-3 font-medium">{u.name || '—'}</td>
                          <td className="px-4 py-3 text-muted-foreground">{u.email || '—'}</td>
                          <td className="px-4 py-3">{u.role || '—'}</td>
                          <td className="px-4 py-3">{u.gender === 'MALE' ? 'Male' : u.gender === 'FEMALE' ? 'Female' : '—'}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusBadgeClass(status)}`}
                            >
                              {status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {isSelf ? (
                              <span className="text-xs text-muted-foreground">(you)</span>
                            ) : (
                              <div className="flex flex-wrap justify-end gap-1">
                                {status !== 'SUSPENDED' && status !== 'BANNED' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={busy}
                                      onClick={() => handleSuspend(u.id)}
                                      className="gap-1"
                                    >
                                      <UserX className="h-3.5 w-3.5" />
                                      Suspend
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={busy}
                                      onClick={() => handleBan(u.id)}
                                      className="gap-1 text-red-600 hover:text-red-700"
                                    >
                                      <Ban className="h-3.5 w-3.5" />
                                      Ban
                                    </Button>
                                  </>
                                )}
                                {(status === 'SUSPENDED' || status === 'BANNED') && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={busy}
                                    onClick={() => handleActivate(u.id)}
                                    className="gap-1 text-green-600 hover:text-green-700"
                                  >
                                    <UserCheck className="h-3.5 w-3.5" />
                                    Activate
                                  </Button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}

export default AdminUsers;
