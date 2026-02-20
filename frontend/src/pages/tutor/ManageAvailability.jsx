/**
 * Tutor Availability Management Page
 * Styling aligned with TutorMyProfile (profile-section-card, section-header, #1A365D).
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { getMyAvailability, createAvailability, updateAvailability } from '@/services/availabilityService';
import '../../styles/Profile.css';

function ManageAvailability() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasExistingAvailability, setHasExistingAvailability] = useState(false);

  // Form state
  const [timezone, setTimezone] = useState('Europe/London');
  const [weeklyRules, setWeeklyRules] = useState([]);
  const [exceptions, setExceptions] = useState([]);

  // Day names for display
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Common timezones
  const timezones = [
    'Europe/London',
    'America/New_York',
    'America/Los_Angeles',
    'America/Chicago',
    'Europe/Paris',
    'Asia/Tokyo',
    'Australia/Sydney',
    'Asia/Dubai',
    'Asia/Kolkata',
    'America/Toronto',
  ];

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setLoading(true);
        const data = await getMyAvailability();
        
        if (data.availability) {
          setHasExistingAvailability(true);
          setTimezone(data.availability.timezone || 'Europe/London');
          setWeeklyRules(data.availability.weeklyRules || []);
          setExceptions(data.availability.exceptions || []);
        } else {
          setHasExistingAvailability(false);
          setTimezone('Europe/London');
        setWeeklyRules([]);
        setExceptions([]);
        }
      } catch (err) {
        toast.error(err.message || 'Could not load your availability.');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, []);

  const handleAddWeeklyRule = () => {
    // Find first available day (not already in rules)
    const usedDays = weeklyRules.map(r => r.dayOfWeek);
    let newDay = 0;
    for (let i = 0; i < 7; i++) {
      if (!usedDays.includes(i)) {
        newDay = i;
        break;
      }
    }

    setWeeklyRules([
      ...weeklyRules,
      { dayOfWeek: newDay, startTime: '09:00', endTime: '17:00' },
    ]);
  };

  const handleUpdateWeeklyRule = (index, field, value) => {
    const updated = [...weeklyRules];
    updated[index] = { ...updated[index], [field]: value };
    setWeeklyRules(updated);
  };

  const handleRemoveWeeklyRule = (index) => {
    setWeeklyRules(weeklyRules.filter((_, i) => i !== index));
  };

  const handleAddException = () => {
    const today = new Date().toISOString().split('T')[0];
    setExceptions([
      ...exceptions,
      { date: today, startTime: '09:00', endTime: '17:00', type: 'unavailable' },
    ]);
  };

  const handleUpdateException = (index, field, value) => {
    const updated = [...exceptions];
    updated[index] = { ...updated[index], [field]: value };
    setExceptions(updated);
  };

  const handleRemoveException = (index) => {
    setExceptions(exceptions.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Ensure data types and formats are correct before sending
      const availabilityData = {
        timezone: timezone?.trim() || 'Europe/London',
        weeklyRules: weeklyRules.map((rule) => ({
          dayOfWeek: typeof rule.dayOfWeek === 'number' ? rule.dayOfWeek : parseInt(rule.dayOfWeek, 10),
          startTime: rule.startTime || '09:00',
          endTime: rule.endTime || '17:00',
        })),
        exceptions: exceptions.map((exception) => ({
          date: exception.date,
          startTime: exception.startTime || '09:00',
          endTime: exception.endTime || '17:00',
          type: exception.type || 'unavailable',
        })),
      };

      // Validate timezone is not empty
      if (!availabilityData.timezone || availabilityData.timezone.trim() === '') {
        toast.error('Please select a timezone.');
        return;
      }

      let result;
      if (hasExistingAvailability) {
        result = await updateAvailability(availabilityData);
        toast.success(result.message || 'Your availability has been updated.');
      } else {
        result = await createAvailability(availabilityData);
        toast.success(result.message || 'Your availability has been saved.');
      }

      setHasExistingAvailability(true);
    } catch (err) {
      console.error('Availability save error:', err);
      let errorMessage = 'Could not save availability.';
      
      if (err.errors) {
        // Validation errors - show detailed messages
        const errorMessages = Object.values(err.errors).join(', ');
        errorMessage = err.message + ': ' + errorMessages;
      } else if (err.rawErrors && Array.isArray(err.rawErrors)) {
        // Raw express-validator errors
        const errorMessages = err.rawErrors.map(e => e.msg || e.message).filter(Boolean).join(', ');
        errorMessage = (err.message || 'Validation failed') + ': ' + errorMessages;
      } else {
        errorMessage = err.message || 'Could not save availability. Please try again.';
      }

      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page-content">
        <Card className="profile-section-card">
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Loading availability...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="profile-page-content">
      <div className="profile-intro flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A365D]">Manage Availability</h1>
          <p className="text-sm text-slate-500 mt-1">Set your weekly schedule and date-specific exceptions</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/tutor')} className="rounded-lg">
          Back to Dashboard
        </Button>
      </div>

      {/* Timezone */}
      <Card className="profile-section-card mt-6">
        <div className="section-header">
          <h3>Timezone</h3>
        </div>
        <div className="section-grid">
          <div className="info-block">
            <Label htmlFor="timezone">Your timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger id="timezone" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Weekly Schedule */}
      <Card className="profile-section-card mt-6">
        <div className="section-header">
          <h3>Weekly schedule</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddWeeklyRule}
            disabled={weeklyRules.length >= 7}
            className="rounded-lg"
          >
            Add day
          </Button>
        </div>
        <div>
          {weeklyRules.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No weekly rules set. Click &quot;Add day&quot; to add a schedule.</p>
          ) : (
            <div className="space-y-3">
              {weeklyRules.map((rule, index) => (
                <div
                  key={index}
                  className="flex flex-wrap items-end gap-3 rounded-md border border-input p-3"
                >
                  <div className="info-block flex-1 min-w-[140px]">
                    <Label>Day</Label>
                    <Select
                      value={rule.dayOfWeek.toString()}
                      onValueChange={(value) =>
                        handleUpdateWeeklyRule(index, 'dayOfWeek', parseInt(value, 10))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {dayNames.map((day, dayIndex) => {
                          const isUsed = weeklyRules.some(
                            (r, i) => i !== index && r.dayOfWeek === dayIndex
                          );
                          return (
                            <SelectItem
                              key={dayIndex}
                              value={dayIndex.toString()}
                              disabled={isUsed}
                            >
                              {day}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="info-block flex-1 min-w-[110px]">
                    <Label>Start</Label>
                    <Input
                      type="time"
                      value={rule.startTime}
                      onChange={(e) =>
                        handleUpdateWeeklyRule(index, 'startTime', e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div className="info-block flex-1 min-w-[110px]">
                    <Label>End</Label>
                    <Input
                      type="time"
                      value={rule.endTime}
                      onChange={(e) =>
                        handleUpdateWeeklyRule(index, 'endTime', e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveWeeklyRule(index)}
                    className="text-destructive hover:text-destructive shrink-0"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Exceptions */}
      <Card className="profile-section-card mt-6">
        <div className="section-header">
          <h3>Exceptions</h3>
          <Button variant="outline" size="sm" onClick={handleAddException} className="rounded-lg">
            Add exception
          </Button>
        </div>
        <div>
          {exceptions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No exceptions set. Add date-specific overrides or mark days unavailable.</p>
          ) : (
            <div className="space-y-3">
              {exceptions.map((exception, index) => (
                <div
                  key={index}
                  className="flex flex-wrap items-end gap-3 rounded-md border border-input p-3"
                >
                  <div className="info-block flex-1 min-w-[140px]">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={exception.date}
                      onChange={(e) =>
                        handleUpdateException(index, 'date', e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div className="info-block flex-1 min-w-[110px]">
                    <Label>Start</Label>
                    <Input
                      type="time"
                      value={exception.startTime}
                      onChange={(e) =>
                        handleUpdateException(index, 'startTime', e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div className="info-block flex-1 min-w-[110px]">
                    <Label>End</Label>
                    <Input
                      type="time"
                      value={exception.endTime}
                      onChange={(e) =>
                        handleUpdateException(index, 'endTime', e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div className="info-block flex-1 min-w-[130px]">
                    <Label>Type</Label>
                    <Select
                      value={exception.type}
                      onValueChange={(value) =>
                        handleUpdateException(index, 'type', value)
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unavailable">Unavailable</SelectItem>
                        <SelectItem value="override">Override</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveException(index)}
                    className="text-destructive hover:text-destructive shrink-0"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mt-6 pb-8 border-t border-slate-100 pt-6">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#1A365D] hover:bg-[#1A365D]/90 text-white font-semibold px-6 rounded-lg"
        >
          {saving ? 'Saving...' : 'Save availability'}
        </Button>
        <Button variant="outline" onClick={() => navigate('/tutor')} disabled={saving} className="rounded-lg">
          Cancel
        </Button>
      </div>
    </div>
  );
}

export default ManageAvailability;
