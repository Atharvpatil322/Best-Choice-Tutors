/**
 * Admin Platform Configuration
 * Edit commission rate, minimum withdrawal amount. Save via admin config API.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getCurrentRole, getStoredUser } from '@/services/authService';
import { getConfig, updateConfig } from '@/services/adminService';
import { toast } from 'sonner';
import '../../styles/Profile.css';

function AdminConfig() {
  const navigate = useNavigate();
  const role = getCurrentRole();
  const isAdmin = typeof role === 'string' && role === 'Admin';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [config, setConfig] = useState(null);
  const [commissionRate, setCommissionRate] = useState('');
  const [minWithdrawalAmount, setMinWithdrawalAmount] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    const fetchConfig = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getConfig();
        setConfig(data);
        setCommissionRate(String(data.commissionRate ?? 0));
        setMinWithdrawalAmount(String(data.minWithdrawalAmount ?? 0));
      } catch (err) {
        setError(err.message || 'Failed to load config');
        setConfig(null);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [isAdmin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const rate = parseFloat(commissionRate, 10);
    const amount = parseFloat(minWithdrawalAmount, 10);

    if (Number.isNaN(rate) || rate < 0 || rate > 100) {
      setError('Commission rate must be between 0 and 100');
      return;
    }
    if (Number.isNaN(amount) || amount < 0) {
      setError('Minimum withdrawal amount must be 0 or greater');
      return;
    }

    setSaving(true);
    try {
      const result = await updateConfig({
        commissionRate: rate,
        minWithdrawalAmount: Math.floor(amount),
      });
      setConfig(result.config ?? result);
      setCommissionRate(String(result.config?.commissionRate ?? rate));
      setMinWithdrawalAmount(String(result.config?.minWithdrawalAmount ?? Math.floor(amount)));
      setSuccess(result.message || 'Config saved successfully');
      toast.success('Config updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to save config');
    } finally {
      setSaving(false);
    }
  };

  const formatUpdatedAt = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
            <p className="text-center text-muted-foreground">Loading config…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="profile-page-content max-w-2xl">
      <div className="profile-intro">
        <h1 className="text-2xl font-bold text-[#1A365D] flex items-center gap-2">
          <Settings className="h-7 w-7" />
          Platform Configuration
        </h1>
        <p className="text-sm text-slate-500 mt-1">Commission rate and minimum withdrawal. Changes are audit-logged.</p>
      </div>

      <Card className="rounded-2xl border-gray-100 shadow-sm mt-6">
        <CardHeader>
          <CardTitle className="text-[#1A365D]">Settings</CardTitle>
          <CardDescription>
              Commission rate (0–100%) and minimum withdrawal amount (in pence). Changes are audit-logged.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              {success && (
                <p className="text-sm text-green-700">{success}</p>
              )}

              <div className="space-y-2">
                <Label htmlFor="commissionRate">Commission rate (%)</Label>
                <Input
                  id="commissionRate"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  placeholder="0"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  disabled={saving}
                />
                <p className="text-xs text-muted-foreground">Platform commission as a percentage (0–100).</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minWithdrawalAmount">Minimum withdrawal amount</Label>
                <Input
                  id="minWithdrawalAmount"
                  type="number"
                  min={0}
                  step={1}
                  placeholder="0"
                  value={minWithdrawalAmount}
                  onChange={(e) => setMinWithdrawalAmount(e.target.value)}
                  disabled={saving}
                />
                <p className="text-xs text-muted-foreground">Minimum amount tutors can withdraw, in pence (GBP).</p>
              </div>

              <Button type="submit" disabled={saving} className="bg-[#1A365D] hover:bg-[#1A365D]/90 rounded-lg">
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </form>

            {config?.updatedAt != null && (
              <p className="mt-4 text-xs text-muted-foreground">
                Last updated: {formatUpdatedAt(config.updatedAt)}
              </p>
            )}
          </CardContent>
        </Card>
    </div>
  );
}

export default AdminConfig;
