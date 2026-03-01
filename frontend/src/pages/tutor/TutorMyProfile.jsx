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
import { CountryCodePicker } from '@/components/ui/country-code-picker';
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
import { Star, Pencil, Save, X, MapPin, User, Trash2, Wallet, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import '../../styles/Profile.css';
import { getCurrentRole, getStoredUser } from '@/services/authService';
import { getMyAvailability } from '@/services/availabilityService';
import { getTutorProfile, updateTutorProfile, createPayoutSetupLink } from '@/services/tutorProfileService';
import { getMyReceivedReviews, reportReview as reportReviewApi } from '@/services/reviewService';
import { forgotPassword } from '@/services/authService';
import { toast } from 'sonner';
import { SubjectSelector } from '@/components/SubjectSelector';

function TutorMyProfile() {
  const navigate = useNavigate();
  const role = getCurrentRole();
  const normalizedRole = typeof role === 'string' ? role.toLowerCase() : null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tutorProfile, setTutorProfile] = useState(null);
  const [userData, setUserData] = useState(null);
  const [gender, setGender] = useState('');
  const [availabilitySummary, setAvailabilitySummary] = useState({
    timezone: null,
    weeklyRules: [],
    exceptions: [],
  });

  // Local editable fields
  const [bio, setBio] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [qualifications, setQualifications] = useState([{ title: '', institution: '', year: '' }]);
  const [subjects, setSubjects] = useState([]);
  const [hourlyRate, setHourlyRate] = useState('');
  const [mode, setMode] = useState('');
  const [location, setLocation] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [saving, setSaving] = useState(false);

  const teachingModes = [
    { value: 'Online', label: 'Online' },
    { value: 'In-Person', label: 'In-Person' },
    { value: 'Both', label: 'Both' },
  ];
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [reviewsReceived, setReviewsReceived] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reportDialogReviewId, setReportDialogReviewId] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportedIds, setReportedIds] = useState(new Set());
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [removeProfilePhoto, setRemoveProfilePhoto] = useState(false);

  // Stripe Connect payout onboarding – redirect to Stripe-hosted flow
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);
  const [payoutSubmitError, setPayoutSubmitError] = useState(null);

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
        const needsSetup = profileData?.needsSetup === true || !tutor;

        if (needsSetup) {
          setTutorProfile(null);
          setNeedsSetup(true);
          setError(null);
          setLoading(false);
          return;
        }

        setNeedsSetup(false);
        setTutorProfile(tutor);
        setUserData(user || null);
        setGender(user?.gender === 'MALE' || user?.gender === 'FEMALE' ? user.gender : '');
        setBio(tutor.bio || '');
        setSubjects(Array.isArray(tutor.subjects) ? [...tutor.subjects] : []);
        setHourlyRate(
          tutor.hourlyRate != null && tutor.hourlyRate !== ''
            ? String(tutor.hourlyRate)
            : ''
        );
        setMode(tutor.mode || '');
       const locValue = tutor.location;
setLocation(
  locValue != null 
    ? (typeof locValue === 'object' ? (locValue.address || '') : String(locValue)) 
    : ''
);
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

  // Refetch profile when user returns to the tab (e.g. after Stripe Connect onboarding) so onboarding status updates from webhook
  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState !== 'visible' || normalizedRole !== 'tutor' || !tutorProfile?.id) return;
      try {
        const profileData = await getTutorProfile();
        const tutor = profileData?.tutor;
        if (tutor) setTutorProfile(tutor);
      } catch {
        // ignore refetch errors
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [normalizedRole, tutorProfile?.id]);

  // While onboarding is PENDING, poll for a short time so we pick up account.updated webhook after return from Stripe
  const payoutStatus = tutorProfile?.payout?.onboardingStatus || 'NOT_STARTED';
  useEffect(() => {
    if (payoutStatus !== 'PENDING' || normalizedRole !== 'tutor' || !tutorProfile?.id) return;
    const interval = setInterval(async () => {
      try {
        const profileData = await getTutorProfile();
        const tutor = profileData?.tutor;
        if (tutor && (tutor.payout?.onboardingStatus === 'COMPLETED' || tutor.payout?.onboardingStatus === 'FAILED')) {
          setTutorProfile(tutor);
        }
      } catch {
        // ignore
      }
    }, 3000);
    const timeout = setTimeout(() => clearInterval(interval), 30000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [payoutStatus, normalizedRole, tutorProfile?.id]);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!tutorProfile?.id) return;
      try {
        setLoadingReviews(true);
        const data = await getMyReceivedReviews();
        setReviewsReceived(data.reviews || []);
      } catch (err) {
        console.log('Failed to load received reviews:', err.message);
        setReviewsReceived([]);
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchReviews();
  }, [tutorProfile?.id]);

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
      toast.error('Please enter your email to receive the reset link.');
      return;
    }
    setShowResetPasswordDialog(true);
  };

  const handleResetPasswordConfirm = async () => {
    const storedUser = getStoredUser();
    if (!storedUser?.email) {
      toast.error('Please enter your email to receive the reset link.');
      setShowResetPasswordDialog(false);
      return;
    }

    try {
      setResettingPassword(true);
      await forgotPassword(storedUser.email);
      toast.success('Password reset link has been sent to your email.');
      setShowResetPasswordDialog(false);
    } catch (err) {
      toast.error(err.message || 'Could not send reset link. Please try again.');
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

  const handleModeChange = (value) => {
    setMode(value);
    if (value === 'Online') setLocation('');
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB.');
      return;
    }
    if (profilePhotoPreview) URL.revokeObjectURL(profilePhotoPreview);
    setProfilePhotoPreview(URL.createObjectURL(file));
    setProfilePhotoFile(file);
    setRemoveProfilePhoto(false);
    e.target.value = '';
  };

  const handleRemovePhoto = () => {
    if (profilePhotoPreview) {
      URL.revokeObjectURL(profilePhotoPreview);
      setProfilePhotoPreview(null);
    }
    setProfilePhotoFile(null);
    setRemoveProfilePhoto(true);
  };

  const resetFormFromProfile = () => {
    if (!tutorProfile) return;
    const tutor = tutorProfile;
    const user = userData || getStoredUser();
    setBio(tutor.bio || '');
    setSubjects(Array.isArray(tutor.subjects) ? [...tutor.subjects] : []);
    setHourlyRate(
      tutor.hourlyRate != null && tutor.hourlyRate !== ''
        ? String(tutor.hourlyRate)
        : ''
    );
    setMode(tutor.mode || '');
    const locValue = tutor.location;
    setLocation(
      locValue != null
        ? (typeof locValue === 'object' ? (locValue.address || '') : String(locValue))
        : ''
    );
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
    const phone = user?.phone || null;
    if (phone && (phone.countryCode || phone.number)) {
      setCountryCode(phone.countryCode || '');
      setPhoneNumber((phone.number || '').replace(/\D/g, ''));
    } else {
      setCountryCode('');
      setPhoneNumber('');
    }
    setGender(user?.gender === 'MALE' || user?.gender === 'FEMALE' ? user.gender : '');
    setPhoneError('');
    if (profilePhotoPreview) URL.revokeObjectURL(profilePhotoPreview);
    setProfilePhotoPreview(null);
    setProfilePhotoFile(null);
    setRemoveProfilePhoto(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    resetFormFromProfile();
  };

  const openReportDialog = (reviewId) => {
    setReportDialogReviewId(reviewId);
    setReportReason('');
  };

  const closeReportDialog = () => {
    setReportDialogReviewId(null);
    setReportReason('');
    setReportSubmitting(false);
  };

  const handleReportSubmit = async () => {
    if (!reportDialogReviewId) return;
    try {
      setReportSubmitting(true);
      await reportReviewApi(reportDialogReviewId, reportReason);
      setReportedIds((prev) => new Set([...prev, reportDialogReviewId]));
      closeReportDialog();
      toast.success('Review has been reported.');
    } catch (err) {
      toast.error(err.message || 'Could not report review. Please try again.');
    } finally {
      setReportSubmitting(false);
    }
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
      toast.error('Please add at least one qualification with title, institution, or year.');
      return;
    }

    if (subjects.length === 0) {
      toast.error('Please select at least one subject.');
      return;
    }

    const rateNum = hourlyRate !== '' ? parseFloat(hourlyRate) : undefined;
    if (rateNum !== undefined && (Number.isNaN(rateNum) || rateNum <= 0)) {
      toast.error('Please enter a valid hourly rate.');
      return;
    }

    if (mode !== '' && !['Online', 'In-Person', 'Both'].includes(mode)) {
      toast.error('Please select a teaching mode: Online, In-Person, or Both.');
      return;
    }

    if ((mode === 'In-Person' || mode === 'Both') && !(location != null && String(location).trim())) {
      toast.error('Please enter a location for in-person or mixed teaching.');
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
        subjects: subjects.length ? subjects : undefined,
        hourlyRate: rateNum !== undefined ? rateNum : undefined,
        mode: mode || undefined,
      location:
  mode === 'Online'
    ? ''
    : mode === 'In-Person' || mode === 'Both'
      ? (typeof location === 'object' ? location.address : String(location).trim())
      : undefined,
        phone: {
          countryCode: countryCode || null,
          number: phoneNumber || null,
        },
        gender: gender === 'MALE' || gender === 'FEMALE' ? gender : undefined,
        ...(profilePhotoFile && { profilePhoto: profilePhotoFile }),
        ...(removeProfilePhoto && { clearProfilePhoto: true }),
      });

      // Update local state from backend response
      if (result.tutor) {
        setTutorProfile(result.tutor);
        setBio(result.tutor.bio || '');
        setSubjects(Array.isArray(result.tutor.subjects) ? [...result.tutor.subjects] : []);
        setHourlyRate(
          result.tutor.hourlyRate != null && result.tutor.hourlyRate !== ''
            ? String(result.tutor.hourlyRate)
            : ''
        );
        setMode(result.tutor.mode || '');
       const newLoc = result.tutor.location;
  setLocation(
    newLoc != null 
      ? (typeof newLoc === 'object' ? (newLoc.address || '') : String(newLoc)) 
      : ''
  );
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

      if (result.user) {
        if (result.user.phone) {
          const phone = result.user.phone;
          setCountryCode(phone.countryCode || '');
          setPhoneNumber((phone.number || '').replace(/\D/g, ''));
        }
        if (result.user.gender !== undefined) {
          setGender(result.user.gender === 'MALE' || result.user.gender === 'FEMALE' ? result.user.gender : '');
        }
        setUserData((prev) => (prev ? { ...prev, ...result.user } : result.user));
      }

      if (profilePhotoPreview) URL.revokeObjectURL(profilePhotoPreview);
      setProfilePhotoPreview(null);
      setProfilePhotoFile(null);
      setRemoveProfilePhoto(false);
      setIsEditing(false);
      // Sync profile photo to stored user so header shows updated image
      const stored = getStoredUser();
      if (stored && result.tutor) {
        try {
          localStorage.setItem('auth_user', JSON.stringify({
            ...stored,
            profilePhoto: result.tutor.profilePhoto ?? stored.profilePhoto,
          }));
        } catch (_) { /* ignore */ }
      }
      window.dispatchEvent(new CustomEvent('tutor-profile-updated'));
      toast.success(result.message || 'Your tutor profile has been updated.');
    } catch (err) {
      if (err.errors) {
        const firstError = Object.values(err.errors)[0];
        toast.error(firstError || err.message || 'Could not save profile. Please try again.');
      } else {
        toast.error(err.message || 'Could not save profile. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCompletePayoutSetup = async () => {
    setPayoutSubmitError(null);
    setPayoutSubmitting(true);
    try {
      const data = await createPayoutSetupLink();
      const url = data?.onboardingUrl;
      if (url) {
        window.location.href = url;
        return;
      }
      setPayoutSubmitError('No redirect URL received. Please try again.');
    } catch (err) {
      const msg = err?.message || 'Failed to start payout setup.';
      setPayoutSubmitError(msg);
      toast.error(msg);
      const profileData = await getTutorProfile().catch(() => null);
      if (profileData?.tutor) setTutorProfile(profileData.tutor);
    } finally {
      setPayoutSubmitting(false);
    }
  };

  const payoutError = tutorProfile?.payout?.lastOnboardingError || null;
  const chargesEnabled = tutorProfile?.payout?.chargesEnabled ?? false;
  const payoutsEnabled = tutorProfile?.payout?.payoutsEnabled ?? false;

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Loading tutor profile...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <p className="text-center text-red-600">{error}</p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={() => navigate('/tutor')}>
                Back to Tutor Dashboard
              </Button>
              <Button variant="outline" onClick={() => navigate('/tutor/create')}>
                Create Tutor Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No Tutor document yet: show setup CTA (matches tutor dashboard styling)
  if (needsSetup) {
    return (
      <div className="space-y-6">
        <div className="profile-intro">
          <h1 className="text-2xl font-bold text-[#1A365D]">My Tutor Profile</h1>
          <p className="text-sm text-slate-500">Set up your teaching profile so learners can find and book you</p>
        </div>
        <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden">
          <CardContent className="p-8 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#1A365D]/10 flex items-center justify-center mx-auto">
                <User size={32} className="text-[#1A365D]" />
              </div>
              <h2 className="text-xl font-semibold text-[#1A365D]">Complete your tutor profile</h2>
              <p className="text-sm text-slate-600">
                Add your subjects, qualifications, hourly rate and availability. Your profile will then appear to learners when they browse tutors.
              </p>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <Button onClick={() => navigate('/tutor/create')} className="bg-[#1A365D] hover:bg-[#1A365D]/90 text-white font-semibold px-6 rounded-lg">
                  Complete profile
                </Button>
                <Button variant="outline" onClick={() => navigate('/tutor')} className="rounded-lg">
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const storedUser = getStoredUser();
  const isPhoneValidationActive = !!countryCode;
  const isPhoneInvalid = !!phoneError;
  const isSaveDisabled = saving || (isPhoneValidationActive && isPhoneInvalid);

  return (
    <div className="profile-page-content min-w-0 overflow-x-hidden">
      <div className="profile-intro">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1a365d] truncate">
          {isEditing ? 'Edit Your Tutor Profile' : 'My Tutor Profile'}
        </h1>
        <p className="text-sm text-slate-500">View and manage your teaching profile</p>
      </div>

      {/* Hero Profile Card – responsive: stacks on mobile, profile picture section contained */}
      <div className="profile-hero-banner mt-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-6 w-full min-w-0">
          <div className="relative shrink-0 w-24 h-24 flex items-center justify-center">
            {(() => {
              const showPhoto = !removeProfilePhoto && (profilePhotoPreview || tutorProfile?.profilePhoto || storedUser?.profilePhoto);
              const photoSrc = profilePhotoPreview || tutorProfile?.profilePhoto || storedUser?.profilePhoto;
              return showPhoto && photoSrc ? (
                <img
                  src={photoSrc}
                  alt={tutorProfile?.fullName || storedUser?.name}
                  className="w-24 h-24 rounded-full border-4 border-white/20 object-cover object-center"
                />
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-white/20 flex items-center justify-center bg-white/10 text-white">
                  <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              );
            })()}
            {isEditing && (
              <>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                  id="tutor-profile-photo-input"
                />
                <label
                  htmlFor="tutor-profile-photo-input"
                  className="absolute bottom-0 left-0 rounded-full bg-[#1A365D] p-1.5 text-white shadow-md cursor-pointer hover:bg-[#1A365D]/90 border-2 border-white shrink-0"
                  title="Change photo"
                >
                  <Pencil size={14} />
                </label>
                {(tutorProfile?.profilePhoto || storedUser?.profilePhoto || profilePhotoFile) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute bottom-0 right-0 rounded-full bg-[#1A365D] p-1.5 text-white shadow-md h-8 w-8 min-w-8 hover:bg-[#1A365D]/90 border-2 border-white shrink-0"
                    onClick={handleRemovePhoto}
                    title="Remove photo"
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </>
            )}
          </div>
          <div className="hero-text text-center sm:text-left flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-white truncate sm:whitespace-normal">{tutorProfile?.fullName || storedUser?.name || 'Tutor'}</h2>
            <p className="flex items-center justify-center sm:justify-start gap-1 text-white/80 text-sm mt-1 min-w-0">
              <MapPin size={14} className="shrink-0" /> <span className="truncate">{typeof location === 'object' ? (location?.address || '') : (location || '') || 'Location not set'}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 w-full min-w-0">
          <Button variant="ghost" className="text-white hover:bg-white/10 shrink-0" onClick={handleResetPasswordClick}>
            Reset Password
          </Button>
          {isEditing ? (
            <>
              <Button onClick={handleCancel} disabled={saving} variant="ghost" className="text-white hover:bg-white/10 shrink-0">
                <X size={14} className="mr-2" /> Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaveDisabled} className="bg-white text-[#1a365d] hover:bg-slate-100 font-semibold px-4 sm:px-6 rounded-lg shrink-0">
                <Save size={14} className="mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <Button onClick={handleEdit} className="bg-white text-[#1a365d] hover:bg-slate-100 font-semibold px-4 sm:px-6 rounded-lg shrink-0">
              <Pencil size={14} className="mr-2" /> Edit Profile
            </Button>
          )}
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

      <div className="space-y-6 mt-6 pb-12 min-w-0">
        {/* Profile Information – same section card pattern as Learner */}
        <Card className="profile-section-card min-w-0">
          <div className="section-header">
            <h3>Profile Information</h3>
          </div>
          <div className="section-grid">
            <div className="info-block">
              <Label>Full Name</Label>
              <p>{tutorProfile?.fullName || storedUser?.name || 'Not provided'}</p>
            </div>
            <div className="info-block">
              <Label>Email</Label>
              <p className="mt-2 opacity-60">{storedUser?.email || '—'}</p>
            </div>
            <div className="info-block">
              <Label>Gender</Label>
              {isEditing ? (
                <Select value={gender || '__none__'} onValueChange={(v) => setGender(v === '__none__' ? '' : v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select gender..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select gender...</SelectItem>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p>{gender === 'MALE' ? 'Male' : gender === 'FEMALE' ? 'Female' : 'Not set'}</p>
              )}
            </div>
            <div className="info-block">
              <Label>Phone Number</Label>
              {isEditing ? (
                <div className="flex flex-wrap gap-2 mt-1 min-w-0">
                  <CountryCodePicker value={countryCode} onChange={handleCountryCodeChange} placeholder="Code" />
                  <Input type="tel" value={phoneNumber} onChange={(e) => handlePhoneChange(e.target.value)} placeholder="Phone number" className="flex-1 min-w-[120px]" />
                </div>
              ) : (
                <p>{[countryCode, phoneNumber].filter(Boolean).join(' ') || 'Not set'}</p>
              )}
              {isEditing && isPhoneValidationActive && phoneError && <p className="mt-1 text-xs text-red-600">{phoneError}</p>}
              {isEditing && <p className="mt-1 text-xs text-muted-foreground">Validation when country code is selected.</p>}
            </div>
            <div className="info-block col-span-2">
              <Label>Teaching Bio</Label>
              {isEditing ? (
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full mt-1 p-3 text-sm border rounded-lg focus:ring-2 focus:ring-[#1a365d] outline-none"
                  placeholder="Describe your teaching style and what learners can expect."
                />
              ) : (
                <p className="whitespace-pre-wrap">{bio || 'Not provided'}</p>
              )}
            </div>
            <div className="info-block">
              <Label>Subjects</Label>
              {isEditing ? (
                <div className="mt-2">
                  <SubjectSelector value={subjects} onChange={setSubjects} />
                </div>
              ) : (
                <p>{subjects.length > 0 ? subjects.join(', ') : 'Not set'}</p>
              )}
            </div>
            <div className="info-block">
              <Label>Hourly rate</Label>
              {isEditing ? (
                <Input type="number" min={0} step={0.01} value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="e.g. 25" className="mt-1" />
              ) : (
                <p>{hourlyRate !== '' && !Number.isNaN(parseFloat(hourlyRate)) ? `£${hourlyRate}` : 'Not set'}</p>
              )}
              {isEditing && <p className="mt-1 text-xs text-muted-foreground">Must be a positive number.</p>}
            </div>
            <div className="info-block">
              <Label>Teaching mode</Label>
              {isEditing ? (
                <Select value={mode || undefined} onValueChange={handleModeChange}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select mode..." /></SelectTrigger>
                  <SelectContent>
                    {teachingModes.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <p>{mode || 'Not set'}</p>
              )}
            </div>
            {(mode === 'In-Person' || mode === 'Both' || (location && !isEditing)) && (
              <div className="info-block">
                <Label>Location</Label>
                {isEditing && (mode === 'In-Person' || mode === 'Both') ? (
                  <>
                    <Input
                      type="text"
                      value={typeof location === 'object' ? (location?.address || '') : (location || '')}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Mumbai, India or postcode"
                      className="mt-1"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">Required when teaching in-person.</p>
                  </>
                ) : (
                  <p>{typeof location === 'object' ? (location?.address || '') : (location || '') || 'Not set'}</p>
                )}
              </div>
            )}
            <div className="info-block">
              <Label>Years of Experience</Label>
              {isEditing ? (
                <Input type="number" min={0} value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} placeholder="e.g. 5" className="mt-1" />
              ) : (
                <p>{experienceYears !== '' && experienceYears != null ? experienceYears : 'Not set'}</p>
              )}
            </div>
            <div className="info-block col-span-2">
              <Label>Qualifications</Label>
              {isEditing ? (
                <>
                  <p className="mt-1 text-xs text-muted-foreground mb-2">Add at least one qualification. Empty rows are ignored on save.</p>
                  <div className="space-y-3">
                    {qualifications.map((q, index) => (
                      <div key={index} className="flex flex-wrap items-end gap-2 rounded-md border border-input p-3">
                        <div className="grid flex-1 gap-2 min-w-0 sm:grid-cols-3">
                          <div>
                            <Label htmlFor={`qual-title-${index}`} className="text-xs">Title</Label>
                            <Input id={`qual-title-${index}`} placeholder="e.g. BSc Mathematics" value={q.title} onChange={(e) => handleQualificationChange(index, 'title', e.target.value)} className="mt-1 h-9" />
                          </div>
                          <div>
                            <Label htmlFor={`qual-institution-${index}`} className="text-xs">Institution</Label>
                            <Input id={`qual-institution-${index}`} placeholder="e.g. University of London" value={q.institution} onChange={(e) => handleQualificationChange(index, 'institution', e.target.value)} className="mt-1 h-9" />
                          </div>
                          <div>
                            <Label htmlFor={`qual-year-${index}`} className="text-xs">Year</Label>
                            <Input id={`qual-year-${index}`} placeholder="e.g. 2020" value={q.year} onChange={(e) => handleQualificationChange(index, 'year', e.target.value)} className="mt-1 h-9" />
                          </div>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeQualification(index)} className="text-destructive hover:text-destructive shrink-0">Remove</Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addQualification}>Add more</Button>
                  </div>
                </>
              ) : (
                <div className="mt-1">
                  {qualifications.filter((q) => q.title || q.institution || q.year).length > 0 ? (
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {qualifications.filter((q) => q.title || q.institution || q.year).map((q, i) => (
                        <li key={i}>{[q.title, q.institution, q.year].filter(Boolean).join(' — ')}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>Not set</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Payout Details – Stripe Connect Express onboarding (Stripe hosts KYC + bank details) */}
        <Card className="profile-section-card min-w-0">
          <div className="section-header">
            <h3 className="flex items-center gap-2">
              <Wallet size={18} className="shrink-0" />
              Payout Details
            </h3>
          </div>
          <CardDescription className="px-6 pb-2 text-sm text-muted-foreground">
            Complete payout setup with Stripe to receive earnings. You will be redirected to Stripe to add your details; no bank details are stored on this site.
          </CardDescription>
          <div className="section-grid px-6 pb-6">
            <div className="col-span-2 flex flex-wrap items-center gap-2">
              <Label className="text-sm font-medium">Onboarding status</Label>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                  payoutStatus === 'COMPLETED'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : payoutStatus === 'PENDING'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                      : payoutStatus === 'FAILED'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {payoutStatus === 'COMPLETED' && <CheckCircle size={14} className="shrink-0" />}
                {payoutStatus === 'PENDING' && <Loader2 size={14} className="shrink-0 animate-spin" />}
                {payoutStatus === 'FAILED' && <AlertCircle size={14} className="shrink-0" />}
                {payoutStatus.replace('_', ' ')}
              </span>
            </div>
            {payoutStatus === 'COMPLETED' && (chargesEnabled || payoutsEnabled) && (
              <div className="col-span-2 text-sm text-muted-foreground">
                {chargesEnabled && <span>Can accept charges</span>}
                {chargesEnabled && payoutsEnabled && ' · '}
                {payoutsEnabled && <span>Can receive payouts</span>}
              </div>
            )}
            {payoutStatus === 'FAILED' && payoutError && (
              <div className="col-span-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/30">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">Error</p>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">{payoutError}</p>
              </div>
            )}
            {payoutStatus === 'PENDING' && (
              <p className="col-span-2 text-sm text-muted-foreground">
                Stripe is reviewing your account. In test mode, your connected account may stay &quot;Restricted&quot; until the platform completes &quot;Verify your business&quot; in the Stripe Dashboard. Refresh this page after a few minutes to see if status has updated.
              </p>
            )}

            {payoutStatus !== 'COMPLETED' && (
              <div className="col-span-2 space-y-2">
                {payoutSubmitError && (
                  <p className="text-sm text-destructive">{payoutSubmitError}</p>
                )}
                <Button
                  type="button"
                  onClick={handleCompletePayoutSetup}
                  disabled={payoutSubmitting}
                  className="bg-[#1A365D] hover:bg-[#1A365D]/90"
                >
                  {payoutSubmitting ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin shrink-0" />
                      Redirecting…
                    </>
                  ) : (
                    'Complete Payout Setup'
                  )}
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Availability Summary – same section card pattern as Learner */}
        <Card className="profile-section-card min-w-0">
          <div className="section-header">
            <h3>Availability</h3>
            <Button variant="outline" size="sm" onClick={() => navigate('/tutor/availability')}>
              Manage Availability
            </Button>
          </div>
          <div className="section-grid">
            <div className="info-block">
              <Label>Timezone</Label>
              <p>
                {availabilitySummary.timezone || 'Not set'}
              </p>
            </div>
            <div className="info-block">
              <Label>Weekly Rules</Label>
              {availabilitySummary.weeklyRules.length === 0 ? (
                <p className="text-muted-foreground">No weekly rules configured yet.</p>
              ) : (
                <ul className="mt-1 space-y-1 text-sm">
                  {availabilitySummary.weeklyRules.map((rule, index) => (
                    <li key={index} className="flex justify-between">
                      <span>{formatRuleDay(rule.dayOfWeek)}</span>
                      <span>{rule.startTime} – {rule.endTime}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="info-block">
              <Label>Exceptions</Label>
              {availabilitySummary.exceptions.length === 0 ? (
                <p className="text-muted-foreground">No exceptions configured. Add them from Manage Availability.</p>
              ) : (
                <p className="text-muted-foreground">{availabilitySummary.exceptions.length} exception(s) configured.</p>
              )}
            </div>
          </div>
        </Card>

        {/* Reviews received – same section card pattern */}
        <Card className="profile-section-card min-w-0">
          <div className="section-header">
            <h3>Reviews received</h3>
          </div>
          <div>
            {loadingReviews ? (
              <p className="text-sm text-muted-foreground">Loading reviews...</p>
            ) : reviewsReceived.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reviews yet.</p>
            ) : (
              <ul className="space-y-4">
                {reviewsReceived.map((review) => {
                  const isReported = review.isReported || reportedIds.has(review.id);
                  return (
                    <li
                      key={review.id}
                      className="rounded-lg border border-input p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((value) => (
                            <Star
                              key={value}
                              className={`h-4 w-4 ${value <= (review.rating || 0)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-muted-foreground/40'
                                }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {review.createdAt
                            ? new Date(review.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                            : '—'}
                        </span>
                      </div>
                      {review.reviewText ? (
                        <p className="text-sm text-muted-foreground">{review.reviewText}</p>
                      ) : null}
                      <div className="flex items-center gap-2 pt-1">
                        {!isReported ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openReportDialog(review.id)}
                          >
                            Report review
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Reported</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>
      </div>

      {/* Report review dialog: prompt for reason, submit to API, disable after success */}
      <AlertDialog open={!!reportDialogReviewId} onOpenChange={(open) => !open && closeReportDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Report review</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for reporting this review (optional). Your report will be reviewed by our team.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label htmlFor="report-reason" className="text-sm">
              Reason
            </Label>
            <textarea
              id="report-reason"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="e.g. Inappropriate language, false claims..."
              rows={3}
              className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reportSubmitting}>Cancel</AlertDialogCancel>
            <Button onClick={handleReportSubmit} disabled={reportSubmitting}>
              {reportSubmitting ? 'Submitting...' : 'Submit report'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default TutorMyProfile;

