/**
 * Tutor "My Profile" Management Page
 *
 * Tutor-only screen for managing:
 * - Basic profile info (read-only email, editable bio placeholder)
 * - Profile photo (UI only – backend update API missing)
 * - Phone number (TODO: requires backend API for tutors)
 * - Availability summary (rules + exceptions) with link to full editor
 * - Reset password (reuses existing forgot-password flow)
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getCurrentRole, getStoredUser } from '@/services/authService';
import { getMyAvailability } from '@/services/availabilityService';
import { getTutorProfile, updateTutorProfile } from '@/services/tutorProfileService';
import { forgotPassword } from '@/services/authService';
import { toast } from 'sonner';

function TutorMyProfile() {
  const navigate = useNavigate();
  const role = getCurrentRole();
  const normalizedRole = typeof role === 'string' ? role.toLowerCase() : null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tutorProfile, setTutorProfile] = useState(null);
  const [availabilitySummary, setAvailabilitySummary] = useState({
    timezone: null,
    weeklyRules: [],
    exceptions: [],
  });

  // Local editable fields
  const [bio, setBio] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [qualifications, setQualifications] = useState([{ title: '', institution: '', year: '' }]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  // Tutor-only guard
  useEffect(() => {
    if (normalizedRole && normalizedRole !== 'tutor') {
      setError('Tutor profile is only available for tutor accounts.');
      setLoading(false);
    }
  }, [normalizedRole]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedUser = getStoredUser();
        if (!storedUser?.id) {
          setError('Unable to determine current user.');
          setLoading(false);
          return;
        }

        // Fetch tutor profile via dedicated API
        const profileData = await getTutorProfile();
        const tutor = profileData?.tutor || null;
        const user = profileData?.user || null;

        if (!tutor) {
          setError('Tutor profile not found. Please create your tutor profile.');
          setLoading(false);
          return;
        }

        setTutorProfile(tutor);
        setBio(tutor.bio || '');
        setExperienceYears(
          tutor.experienceYears !== undefined && tutor.experienceYears !== null
            ? String(tutor.experienceYears)
            : ''
        );
        const quals = tutor.qualifications;
        if (Array.isArray(quals) && quals.length > 0) {
          setQualifications(
            quals.map((q) => ({
              title: q.title != null ? String(q.title).trim() : '',
              institution: q.institution != null ? String(q.institution).trim() : '',
              year: q.year != null ? String(q.year).trim() : '',
            }))
          );
        } else {
          setQualifications([{ title: '', institution: '', year: '' }]);
        }

        // Initialize phone from structured object only
        const phone = user?.phone || null;
        if (phone && (phone.countryCode || phone.number)) {
          setCountryCode(phone.countryCode || '');
          setPhoneNumber((phone.number || '').replace(/\D/g, ''));
        } else {
          setCountryCode('');
          setPhoneNumber('');
        }

        // Fetch availability summary (uses existing /tutors/me/availability)
        try {
          const availabilityData = await getMyAvailability();
          const availability = availabilityData?.availability || null;
          setAvailabilitySummary({
            timezone: availability?.timezone || null,
            weeklyRules: availability?.weeklyRules || [],
            exceptions: availability?.exceptions || [],
          });
        } catch (err) {
          // Availability is optional; show placeholder if missing
          console.log('Tutor availability not found:', err.message);
        }

        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to load tutor profile.');
      } finally {
        setLoading(false);
      }
    };

    if (!normalizedRole || normalizedRole === 'tutor') {
      loadData();
    }
  }, [normalizedRole]);

  const validatePhone = (code, number) => {
    if (!code) {
      return '';
    }

    // Only validate +91 specifically as per requirements
    if (code === '+91') {
      if (number && number.length !== 10) {
        return 'For +91, phone number must be exactly 10 digits.';
      }
    }

    return '';
  };

  const handleResetPasswordClick = () => {
    const storedUser = getStoredUser();
    if (!storedUser?.email) {
      toast.error('Unable to send reset link: email is missing.');
      return;
    }
    setShowResetPasswordDialog(true);
  };

  const handleResetPasswordConfirm = async () => {
    const storedUser = getStoredUser();
    if (!storedUser?.email) {
      toast.error('Unable to send reset link: email is missing.');
      setShowResetPasswordDialog(false);
      return;
    }

    try {
      setResettingPassword(true);
      await forgotPassword(storedUser.email);
      toast.success('Password reset link sent to your email.');
      setShowResetPasswordDialog(false);
    } catch (err) {
      toast.error(err.message || 'Failed to send reset link.');
    } finally {
      setResettingPassword(false);
    }
  };

  const formatRuleDay = (dayOfWeek) => {
    const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return names[dayOfWeek] ?? `Day ${dayOfWeek}`;
  };

  const handlePhoneChange = (value) => {
    // Numeric only
    const digitsOnly = value.replace(/\D/g, '');
    setPhoneNumber(digitsOnly);
    setPhoneError(validatePhone(countryCode, digitsOnly));
  };

  const handleCountryCodeChange = (value) => {
    setCountryCode(value);
    setPhoneError(validatePhone(value, phoneNumber));
  };

  const handleQualificationChange = (index, field, value) => {
    setQualifications((prev) => {
      const next = prev.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      );
      return next;
    });
  };

  const addQualification = () => {
    setQualifications((prev) => [...prev, { title: '', institution: '', year: '' }]);
  };

  const removeQualification = (index) => {
    setQualifications((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length ? next : [{ title: '', institution: '', year: '' }];
    });
  };

  const handleSave = async () => {
    const nonEmptyQualifications = qualifications
      .map((q) => ({
        title: (q.title || '').trim(),
        institution: (q.institution || '').trim(),
        year: (q.year || '').trim(),
      }))
      .filter((q) => q.title || q.institution || q.year);

    if (nonEmptyQualifications.length === 0) {
      toast.error('Add at least one qualification (title, institution, or year).');
      return;
    }

    try {
      setSaving(true);

      const result = await updateTutorProfile({
        bio: bio || '',
        experienceYears:
          experienceYears !== '' && experienceYears !== null
            ? parseInt(experienceYears, 10)
            : undefined,
        qualifications: nonEmptyQualifications,
        phone: {
          countryCode: countryCode || null,
          number: phoneNumber || null,
        },
      });

      // Update local state from backend response
      if (result.tutor) {
        setTutorProfile(result.tutor);
        setBio(result.tutor.bio || '');
        setExperienceYears(
          result.tutor.experienceYears !== undefined && result.tutor.experienceYears !== null
            ? String(result.tutor.experienceYears)
            : ''
        );
        const quals = result.tutor.qualifications;
        if (Array.isArray(quals) && quals.length > 0) {
          setQualifications(
            quals.map((q) => ({
              title: q.title != null ? String(q.title).trim() : '',
              institution: q.institution != null ? String(q.institution).trim() : '',
              year: q.year != null ? String(q.year).trim() : '',
            }))
          );
        }
      }

      if (result.user && result.user.phone) {
        const phone = result.user.phone;
        setCountryCode(phone.countryCode || '');
        setPhoneNumber((phone.number || '').replace(/\D/g, ''));
      }

      toast.success(result.message || 'Tutor profile updated successfully.');
    } catch (err) {
      if (err.errors) {
        const firstError = Object.values(err.errors)[0];
        toast.error(firstError || err.message || 'Failed to save profile.');
      } else {
        toast.error(err.message || 'Failed to save profile.');
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
              <p className="text-center text-muted-foreground">Loading tutor profile...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="container mx-auto max-w-4xl">
          <Card>
            <CardContent className="p-6 space-y-4">
              <p className="text-center text-red-600">{error}</p>
              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={() => navigate('/tutor/dashboard')}>
                  Back to Tutor Dashboard
                </Button>
                <Button variant="outline" onClick={() => navigate('/tutor/create')}>
                  Create Tutor Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const storedUser = getStoredUser();
  const isPhoneValidationActive = !!countryCode;
  const isPhoneInvalid = !!phoneError;
  const isSaveDisabled = saving || (isPhoneValidationActive && isPhoneInvalid);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="container mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Tutor Profile</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleResetPasswordClick}>
              Reset Password
            </Button>
            <Button variant="outline" onClick={() => navigate('/tutor/dashboard')}>
              Tutor Dashboard
            </Button>
          </div>
        </div>

        {/* Reset Password Confirmation Dialog */}
        <AlertDialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset Password</AlertDialogTitle>
              <AlertDialogDescription>
                We will send a password reset link to:
                <br />
                <span className="font-medium text-foreground mt-1 block">
                  {storedUser?.email || 'your email address'}
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={resettingPassword}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetPasswordConfirm} disabled={resettingPassword}>
                {resettingPassword ? 'Sending...' : 'Continue'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Basic Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your teaching bio and review your public tutor profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="flex-shrink-0">
                {tutorProfile?.profilePhoto || storedUser?.profilePhoto ? (
                  <img
                    src={tutorProfile?.profilePhoto || storedUser?.profilePhoto}
                    alt={tutorProfile?.fullName || storedUser?.name}
                    className="h-32 w-32 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gray-200 text-gray-400">
                    <svg
                      className="h-16 w-16"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <Label>Name</Label>
                  <p className="mt-1 text-sm">
                    {tutorProfile?.fullName || storedUser?.name || 'Not provided'}
                  </p>
                </div>
                <div>
                  <Label>Email (read-only)</Label>
                  <Input
                    type="email"
                    value={storedUser?.email || ''}
                    disabled
                    className="mt-1 bg-gray-100"
                  />
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <div className="mt-1 flex gap-2">
                    <div className="w-32">
                      <Select value={countryCode} onValueChange={handleCountryCodeChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Code" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="+91">+91 (India)</SelectItem>
                          <SelectItem value="+44">+44 (UK)</SelectItem>
                          <SelectItem value="+1">+1 (US/Canada)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="Phone number"
                      className="flex-1"
                    />
                  </div>
                  {isPhoneValidationActive && phoneError && (
                    <p className="mt-1 text-xs text-red-600">
                      {phoneError}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Validation is enforced only when a country code is selected.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Label>Teaching Bio</Label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Describe your teaching style and what learners can expect."
              />
            </div>

            <div>
              <Label htmlFor="experienceYears">Years of Experience</Label>
              <Input
                id="experienceYears"
                type="number"
                min={0}
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                placeholder="e.g. 5"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Qualifications</Label>
              <p className="mt-1 text-xs text-muted-foreground mb-2">
                Add at least one qualification. Empty rows are ignored on save.
              </p>
              <div className="space-y-3">
                {qualifications.map((q, index) => (
                  <div
                    key={index}
                    className="flex flex-wrap items-end gap-2 rounded-md border border-input p-3"
                  >
                    <div className="grid flex-1 gap-2 min-w-0 sm:grid-cols-3">
                      <div>
                        <Label htmlFor={`qual-title-${index}`} className="text-xs">
                          Title
                        </Label>
                        <Input
                          id={`qual-title-${index}`}
                          placeholder="e.g. BSc Mathematics"
                          value={q.title}
                          onChange={(e) => handleQualificationChange(index, 'title', e.target.value)}
                          className="mt-1 h-9"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`qual-institution-${index}`} className="text-xs">
                          Institution
                        </Label>
                        <Input
                          id={`qual-institution-${index}`}
                          placeholder="e.g. University of London"
                          value={q.institution}
                          onChange={(e) => handleQualificationChange(index, 'institution', e.target.value)}
                          className="mt-1 h-9"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`qual-year-${index}`} className="text-xs">
                          Year
                        </Label>
                        <Input
                          id={`qual-year-${index}`}
                          placeholder="e.g. 2020"
                          value={q.year}
                          onChange={(e) => handleQualificationChange(index, 'year', e.target.value)}
                          className="mt-1 h-9"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQualification(index)}
                      className="text-destructive hover:text-destructive shrink-0"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addQualification}>
                  Add more
                </Button>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaveDisabled}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Availability Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Availability</CardTitle>
                <CardDescription>
                  Summary of your weekly rules and exceptions.
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => navigate('/tutor/availability')}>
                Manage Availability
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Timezone</Label>
              <p className="mt-1 text-sm">
                {availabilitySummary.timezone || 'Not set'}
              </p>
            </div>

            <div>
              <Label>Weekly Rules</Label>
              {availabilitySummary.weeklyRules.length === 0 ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  No weekly rules configured yet.
                </p>
              ) : (
                <ul className="mt-2 space-y-1 text-sm">
                  {availabilitySummary.weeklyRules.map((rule, index) => (
                    <li key={index} className="flex justify-between">
                      <span>{formatRuleDay(rule.dayOfWeek)}</span>
                      <span>
                        {rule.startTime} – {rule.endTime}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <Label>Exceptions</Label>
              {availabilitySummary.exceptions.length === 0 ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  No exceptions configured. You can add exceptions from the Manage Availability page.
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">
                  {availabilitySummary.exceptions.length} exception(s) configured.
                  {/* Basic support only; full editing is available in the dedicated availability screen. */}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default TutorMyProfile;

