/**
 * Tutor Availability Management Page
 * UI task: Tutor availability management (tutor view)
 * 
 * Features:
 * - Fetch tutor's availability from GET /api/tutors/me/availability
 * - Allow tutor to set timezone
 * - Add/edit weekly rules (day, start time, end time)
 * - Add/remove exceptions (date, start, end, unavailable/override)
 * - Save changes via POST/PUT /api/tutors/me/availability
 * - Show success/error feedback
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
import { getMyAvailability, createAvailability, updateAvailability } from '@/services/availabilityService';

function ManageAvailability() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
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
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to load availability');
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
      setError(null);
      setSuccess(null);

      const availabilityData = {
        timezone,
        weeklyRules,
        exceptions,
      };

      let result;
      if (hasExistingAvailability) {
        result = await updateAvailability(availabilityData);
      } else {
        result = await createAvailability(availabilityData);
      }

      setSuccess(result.message || 'Availability saved successfully');
      setHasExistingAvailability(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      if (err.errors) {
        // Validation errors
        const errorMessages = Object.values(err.errors).join(', ');
        setError(err.message + ': ' + errorMessages);
      } else {
        setError(err.message || 'Failed to save availability');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="container mx-auto max-w-4xl">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">Loading availability...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Manage Availability</h1>
            <p className="mt-2 text-muted-foreground">
              Set your weekly schedule and exceptions
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/tutor/dashboard')}>
            Back to Dashboard
          </Button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 rounded-md bg-green-50 p-4 text-green-800 border border-green-200">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-red-800 border border-red-200">
            {error}
          </div>
        )}

        {/* Timezone */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Timezone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="timezone">Select your timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Rules */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Weekly Schedule</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddWeeklyRule}
                disabled={weeklyRules.length >= 7}
              >
                Add Day
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {weeklyRules.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No weekly rules set. Click "Add Day" to add a schedule.
              </p>
            ) : (
              <div className="space-y-4">
                {weeklyRules.map((rule, index) => (
                  <div
                    key={index}
                    className="flex flex-wrap items-end gap-4 border rounded-lg p-4"
                  >
                    <div className="flex-1 min-w-[150px]">
                      <Label>Day</Label>
                      <Select
                        value={rule.dayOfWeek.toString()}
                        onValueChange={(value) =>
                          handleUpdateWeeklyRule(index, 'dayOfWeek', parseInt(value, 10))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {dayNames.map((day, dayIndex) => {
                            // Check if this day is already used by another rule
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
                    <div className="flex-1 min-w-[120px]">
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={rule.startTime}
                        onChange={(e) =>
                          handleUpdateWeeklyRule(index, 'startTime', e.target.value)
                        }
                      />
                    </div>
                    <div className="flex-1 min-w-[120px]">
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={rule.endTime}
                        onChange={(e) =>
                          handleUpdateWeeklyRule(index, 'endTime', e.target.value)
                        }
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveWeeklyRule(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exceptions */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Exceptions</CardTitle>
              <Button variant="outline" size="sm" onClick={handleAddException}>
                Add Exception
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {exceptions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No exceptions set. Click "Add Exception" to add a date-specific override.
              </p>
            ) : (
              <div className="space-y-4">
                {exceptions.map((exception, index) => (
                  <div
                    key={index}
                    className="flex flex-wrap items-end gap-4 border rounded-lg p-4"
                  >
                    <div className="flex-1 min-w-[150px]">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={exception.date}
                        onChange={(e) =>
                          handleUpdateException(index, 'date', e.target.value)
                        }
                      />
                    </div>
                    <div className="flex-1 min-w-[120px]">
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={exception.startTime}
                        onChange={(e) =>
                          handleUpdateException(index, 'startTime', e.target.value)
                        }
                      />
                    </div>
                    <div className="flex-1 min-w-[120px]">
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={exception.endTime}
                        onChange={(e) =>
                          handleUpdateException(index, 'endTime', e.target.value)
                        }
                      />
                    </div>
                    <div className="flex-1 min-w-[150px]">
                      <Label>Type</Label>
                      <Select
                        value={exception.type}
                        onValueChange={(value) =>
                          handleUpdateException(index, 'type', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unavailable">Unavailable</SelectItem>
                          <SelectItem value="override">Override</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveException(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => navigate('/tutor/dashboard')}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Availability'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ManageAvailability;
