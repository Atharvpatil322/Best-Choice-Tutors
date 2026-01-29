/**
 * My Profile Page
 * Displays and allows editing of learner profile information
 * FR-4.1.1, FR-4.1.2, UC-4.1, UC-4.2: Learner Updates Basic Profile Information and Learning Preferences
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
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
import { getLearnerProfile, updateLearnerProfile } from '@/services/learnerProfileService';
import { logout, getCurrentRole } from '@/services/authService';

function MyProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: { countryCode: '', number: '' },
    profilePhoto: null,
    profilePhotoPreview: null,
    gradeLevel: '',
    subjectsOfInterest: [],
    dob: '',
    preferredLanguage: '',
    address: '',
    instituteName: '',
    learningGoal: '',
  });

  // Available grade levels (UK-based)
  // TODO: CLARIFICATION REQUIRED - Should grade levels be fetched from backend or config?
  const GRADE_NONE = '__none__'; // Radix Select disallows empty string for SelectItem value
  const gradeLevels = [
    { value: GRADE_NONE, label: 'Select grade level...' },
    { value: 'Year 1', label: 'Year 1' },
    { value: 'Year 2', label: 'Year 2' },
    { value: 'Year 3', label: 'Year 3' },
    { value: 'Year 4', label: 'Year 4' },
    { value: 'Year 5', label: 'Year 5' },
    { value: 'Year 6', label: 'Year 6' },
    { value: 'Year 7', label: 'Year 7' },
    { value: 'Year 8', label: 'Year 8' },
    { value: 'Year 9', label: 'Year 9' },
    { value: 'Year 10', label: 'Year 10' },
    { value: 'Year 11', label: 'Year 11' },
    { value: 'Year 12', label: 'Year 12' },
    { value: 'Year 13', label: 'Year 13' },
    { value: 'GCSE', label: 'GCSE' },
    { value: 'A-Level', label: 'A-Level' },
    { value: 'University', label: 'University' },
    { value: 'Adult Learning', label: 'Adult Learning' },
  ];

  // Available subjects
  // TODO: CLARIFICATION REQUIRED - Should subjects be fetched from backend or config?
  const availableSubjects = [
    'Mathematics',
    'English',
    'Science',
    'Physics',
    'Chemistry',
    'Biology',
    'History',
    'Geography',
    'French',
    'Spanish',
    'German',
    'Computer Science',
    'Economics',
    'Business Studies',
    'Psychology',
    'Art',
    'Music',
    'Drama',
    'Physical Education',
    'Other',
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      // Only learners should call learner profile API
      const role = getCurrentRole();
      const normalizedRole = typeof role === 'string' ? role.toLowerCase() : null;
      if (normalizedRole && normalizedRole !== 'learner') {
        setLoading(false);
        setError('Learner profile is only available for learner accounts.');
        return;
      }

      try {
        setLoading(true);
        const data = await getLearnerProfile();
        setProfile(data);
        const phone = data.phone || {};
        const dobVal = data.dob;
        const dobStr = !dobVal ? '' : (typeof dobVal === 'string' ? dobVal.slice(0, 10) : new Date(dobVal).toISOString().slice(0, 10));
        setFormData({
          name: data.name || '',
          phone: {
            countryCode: phone.countryCode || '',
            number: (phone.number || '').replace(/\D/g, ''),
          },
          profilePhoto: null,
          profilePhotoPreview: data.profilePhoto || null,
          gradeLevel: data.learningPreferences?.gradeLevel || '',
          subjectsOfInterest: data.learningPreferences?.subjectsOfInterest || [],
          dob: dobStr,
          preferredLanguage: data.preferredLanguage || '',
          address: data.address || '',
          instituteName: data.learningPreferences?.instituteName || '',
          learningGoal: data.learningPreferences?.learningGoal || '',
        });
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to load profile');
        // If unauthorized, redirect to landing page
        if (err.message.includes('Authentication') || err.message.includes('401')) {
          logout();
          navigate('/', { replace: true });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleEdit = () => {
    setIsEditing(true);
    setSuccessMessage(null);
    setValidationErrors({});
  };

  const handleCancel = () => {
    setIsEditing(false);
    const phone = profile?.phone || {};
    const dobVal = profile?.dob;
    const dobStr = !dobVal ? '' : (typeof dobVal === 'string' ? dobVal.slice(0, 10) : new Date(dobVal).toISOString().slice(0, 10));
    setFormData({
      name: profile?.name || '',
      phone: {
        countryCode: phone.countryCode || '',
        number: (phone.number || '').replace(/\D/g, ''),
      },
      profilePhoto: null,
      profilePhotoPreview: profile?.profilePhoto || null,
      gradeLevel: profile?.learningPreferences?.gradeLevel || '',
      subjectsOfInterest: profile?.learningPreferences?.subjectsOfInterest || [],
      dob: dobStr,
      preferredLanguage: profile?.preferredLanguage || '',
      address: profile?.address || '',
      instituteName: profile?.learningPreferences?.instituteName || '',
      learningGoal: profile?.learningPreferences?.learningGoal || '',
    });
    setValidationErrors({});
    setSuccessMessage(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phoneNumber') {
      setFormData((prev) => ({
        ...prev,
        phone: { ...prev.phone, number: value.replace(/\D/g, '') },
      }));
      if (validationErrors.phoneNumber) {
        setValidationErrors((prev) => {
          const next = { ...prev };
          delete next.phoneNumber;
          return next;
        });
      }
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handlePhoneCountryCodeChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      phone: { ...prev.phone, countryCode: value === 'none' ? '' : value },
    }));
    if (validationErrors.phoneNumber) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next.phoneNumber;
        return next;
      });
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setValidationErrors((prev) => ({
          ...prev,
          profilePhoto: 'Please select an image file',
        }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setValidationErrors((prev) => ({
          ...prev,
          profilePhoto: 'Image size must be less than 5MB',
        }));
        return;
      }

      setFormData((prev) => ({
        ...prev,
        profilePhoto: file,
        profilePhotoPreview: URL.createObjectURL(file),
      }));

      // Clear validation error
      if (validationErrors.profilePhoto) {
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.profilePhoto;
          return newErrors;
        });
      }
    }
  };

  const handleGradeLevelChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      gradeLevel: value === GRADE_NONE ? '' : value,
    }));
    // Clear validation error
    if (validationErrors.gradeLevel) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.gradeLevel;
        return newErrors;
      });
    }
  };

  const handleSubjectToggle = (subject) => {
    setFormData((prev) => {
      const currentSubjects = prev.subjectsOfInterest || [];
      const isSelected = currentSubjects.includes(subject);
      const newSubjects = isSelected
        ? currentSubjects.filter((s) => s !== subject)
        : [...currentSubjects, subject];

      return {
        ...prev,
        subjectsOfInterest: newSubjects,
      };
    });
    // Clear validation error
    if (validationErrors.subjectsOfInterest) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.subjectsOfInterest;
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    setValidationErrors({});

    try {
      const updateData = {
        name: formData.name.trim(),
        phone: {
          countryCode: formData.phone.countryCode?.trim() || null,
          number: formData.phone.number?.trim() || null,
        },
        gradeLevel: formData.gradeLevel || null,
        subjectsOfInterest: formData.subjectsOfInterest || [],
        dob: formData.dob?.trim() || null,
        preferredLanguage: formData.preferredLanguage?.trim() || null,
        address: formData.address?.trim() || null,
        instituteName: formData.instituteName?.trim() || null,
        learningGoal: formData.learningGoal?.trim() || null,
      };

      if (formData.profilePhoto) {
        updateData.profilePhoto = formData.profilePhoto;
      }

      const updatedProfile = await updateLearnerProfile(updateData);

      setProfile(updatedProfile);
      setIsEditing(false);
      setSuccessMessage('Profile updated successfully!');

      const dobVal = updatedProfile.dob;
      const dobStr = !dobVal ? '' : (typeof dobVal === 'string' ? dobVal.slice(0, 10) : new Date(dobVal).toISOString().slice(0, 10));
      setFormData((prev) => ({
        ...prev,
        profilePhoto: null,
        profilePhotoPreview: updatedProfile.profilePhoto || null,
        gradeLevel: updatedProfile.learningPreferences?.gradeLevel || '',
        subjectsOfInterest: updatedProfile.learningPreferences?.subjectsOfInterest || [],
        dob: dobStr,
        preferredLanguage: updatedProfile.preferredLanguage || '',
        address: updatedProfile.address || '',
        instituteName: updatedProfile.learningPreferences?.instituteName || '',
        learningGoal: updatedProfile.learningPreferences?.learningGoal || '',
      }));
    } catch (err) {
      if (err.errors) {
        // Validation errors from backend
        setValidationErrors(err.errors);
        setError(err.message || 'Validation failed');
      } else {
        setError(err.message || 'Failed to update profile');
      }
    } finally {
      setSaving(false);
    }
  };

  // Placeholder for missing data
  const Placeholder = ({ text }) => (
    <span className="text-muted-foreground italic">{text || 'Not provided'}</span>
  );
  const EmptyField = () => (
    <span className="text-muted-foreground italic">Not added yet. Update in Edit Profile.</span>
  );
  const formatDob = (dateVal) => {
    if (!dateVal) return null;
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="container mx-auto max-w-4xl">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">Loading profile...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="container mx-auto max-w-4xl">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-red-600">Error: {error}</p>
              <div className="mt-4 flex justify-center gap-2">
                <Button variant="outline" onClick={handleBackToDashboard}>
                  Back to Dashboard
                </Button>
              </div>
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
          <h1 className="text-3xl font-bold">My Profile</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBackToDashboard}>
              Dashboard
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 rounded-md bg-green-50 p-4 text-green-800">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && !validationErrors && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-red-800">
            {error}
          </div>
        )}

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  {isEditing
                    ? 'Edit your profile details'
                    : 'Your learner profile details'}
                </CardDescription>
              </div>
              {!isEditing && (
                <Button onClick={handleEdit} variant="outline">
                  Edit Profile
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {isEditing ? (
              /* Edit Mode - Form */
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Photo Upload */}
                <div className="flex flex-col items-center gap-4 sm:flex-row">
                  <div className="flex-shrink-0">
                    {formData.profilePhotoPreview ? (
                      <img
                        src={formData.profilePhotoPreview}
                        alt="Profile preview"
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
                  <div className="flex-1">
                    <Label htmlFor="profilePhoto">Profile Photo</Label>
                    <Input
                      id="profilePhoto"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="mt-1"
                    />
                    {validationErrors.profilePhoto && (
                      <p className="mt-1 text-sm text-red-600">
                        {validationErrors.profilePhoto}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      Optional. Max 5MB. JPG, PNG, or WebP.
                    </p>
                  </div>
                </div>

                {/* Name Field */}
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="mt-1"
                  />
                  {validationErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                  )}
                </div>

                {/* Email Field (Read-only) */}
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="mt-1 bg-gray-100"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>

                {/* Phone (countryCode + number) */}
                <div>
                  <Label>Phone Number</Label>
                  <div className="mt-1 flex gap-2">
                    <Select
                      value={formData.phone.countryCode || 'none'}
                      onValueChange={handlePhoneCountryCodeChange}
                    >
                      <SelectTrigger className="w-[120px]" id="phoneCountryCode">
                        <SelectValue placeholder="Code" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—</SelectItem>
                        <SelectItem value="+91">+91 (India)</SelectItem>
                        <SelectItem value="+44">+44 (UK)</SelectItem>
                        <SelectItem value="+1">+1 (US/Canada)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      value={formData.phone.number}
                      onChange={handleInputChange}
                      placeholder="Phone number"
                      className="flex-1"
                    />
                  </div>
                  {validationErrors.phoneNumber && (
                    <p className="mt-1 text-sm text-red-600">
                      {validationErrors.phoneNumber}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">Optional</p>
                </div>

                {/* Personal Data */}
                <div className="space-y-4 border-t pt-6">
                  <h3 className="text-lg font-semibold">Personal Data</h3>
                  <p className="text-sm text-muted-foreground">Optional.</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="dob">Date of birth</Label>
                      <Input
                        id="dob"
                        name="dob"
                        type="date"
                        value={formData.dob}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="preferredLanguage">Preferred language</Label>
                      <Input
                        id="preferredLanguage"
                        name="preferredLanguage"
                        type="text"
                        value={formData.preferredLanguage}
                        onChange={handleInputChange}
                        placeholder="e.g. English"
                        className="mt-1"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="address">Address</Label>
                      <textarea
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Optional"
                        rows={3}
                        className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Learning Preferences & Academic */}
                <div className="space-y-4 border-t pt-6">
                  <h3 className="text-lg font-semibold">Learning Preferences</h3>
                  <p className="text-sm text-muted-foreground">
                    Optional. Help us match you with the right tutors.
                  </p>

                  {/* Grade Level Dropdown */}
                  <div>
                    <Label htmlFor="gradeLevel">Grade Level</Label>
                    <Select
                      value={formData.gradeLevel || GRADE_NONE}
                      onValueChange={handleGradeLevelChange}
                    >
                      <SelectTrigger className="mt-1" id="gradeLevel">
                        <SelectValue placeholder="Select grade level..." />
                      </SelectTrigger>
                      <SelectContent>
                        {gradeLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {validationErrors.gradeLevel && (
                      <p className="mt-1 text-sm text-red-600">
                        {validationErrors.gradeLevel}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">Optional</p>
                  </div>

                  {/* Subjects Multi-select */}
                  <div>
                    <Label>Subjects of Interest</Label>
                    <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {availableSubjects.map((subject) => {
                        const isSelected = formData.subjectsOfInterest.includes(subject);
                        return (
                          <label
                            key={subject}
                            className="flex cursor-pointer items-center space-x-2 rounded-md border p-2 hover:bg-gray-50"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSubjectToggle(subject)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm">{subject}</span>
                          </label>
                        );
                      })}
                    </div>
                    {validationErrors.subjectsOfInterest && (
                      <p className="mt-1 text-sm text-red-600">
                        {validationErrors.subjectsOfInterest}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      Optional. Select all that apply. You can save with no subjects selected.
                    </p>
                  </div>

                  {/* Academic: Institute Name, Learning Goal */}
                  <div className="space-y-4 pt-4">
                    <h3 className="text-base font-semibold">Academic Information</h3>
                    <div>
                      <Label htmlFor="instituteName">Institute name</Label>
                      <Input
                        id="instituteName"
                        name="instituteName"
                        type="text"
                        value={formData.instituteName}
                        onChange={handleInputChange}
                        placeholder="Optional"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="learningGoal">Learning goal</Label>
                      <textarea
                        id="learningGoal"
                        name="learningGoal"
                        value={formData.learningGoal}
                        onChange={handleInputChange}
                        placeholder="Optional"
                        rows={3}
                        className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-2 border-t pt-4">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              /* View Mode - Read-only Display */
              <>
                {/* Profile Photo */}
                <div className="flex flex-col items-center gap-4 sm:flex-row">
                  <div className="flex-shrink-0">
                    {profile?.profilePhoto ? (
                      <img
                        src={profile.profilePhoto}
                        alt="Profile"
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
                  <div className="text-center sm:text-left">
                    <h2 className="text-2xl font-semibold">
                      {profile?.name || <Placeholder text="Name not provided" />}
                    </h2>
                    <p className="text-muted-foreground">
                      {profile?.email || <Placeholder />}
                    </p>
                  </div>
                </div>

                {/* Basic Details */}
                <div className="space-y-4 border-t pt-6">
                  <h3 className="text-lg font-semibold">Basic Details</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Name</label>
                      <p className="mt-1">
                        {profile?.name || <Placeholder />}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="mt-1">
                        {profile?.email || <Placeholder />}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Phone Number
                      </label>
                      <p className="mt-1">
                        {profile?.phone && (profile.phone.countryCode || profile.phone.number) ? (
                          [profile.phone.countryCode, profile.phone.number].filter(Boolean).join(' ')
                        ) : (
                          <Placeholder />
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Personal Data */}
                <div className="space-y-4 border-t pt-6">
                  <h3 className="text-lg font-semibold">Personal Data</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Date of birth</label>
                      <p className="mt-1">
                        {formatDob(profile?.dob) ? formatDob(profile.dob) : <EmptyField />}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Preferred language</label>
                      <p className="mt-1">
                        {profile?.preferredLanguage?.trim() ? profile.preferredLanguage : <EmptyField />}
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-sm font-medium text-muted-foreground">Address</label>
                      <p className="mt-1">
                        {profile?.address?.trim() ? profile.address : <EmptyField />}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Academic Information */}
                <div className="space-y-4 border-t pt-6">
                  <h3 className="text-lg font-semibold">Academic Information</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Institute name</label>
                      <p className="mt-1">
                        {profile?.learningPreferences?.instituteName?.trim() ? (
                          profile.learningPreferences.instituteName
                        ) : (
                          <EmptyField />
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Learning goal</label>
                      <p className="mt-1">
                        {profile?.learningPreferences?.learningGoal?.trim() ? (
                          profile.learningPreferences.learningGoal
                        ) : (
                          <EmptyField />
                        )}
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-sm font-medium text-muted-foreground">Subjects of interest</label>
                      <p className="mt-1">
                        {profile?.learningPreferences?.subjectsOfInterest?.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {profile.learningPreferences.subjectsOfInterest.map((subject, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-0.5 text-sm font-medium text-blue-700"
                              >
                                {subject}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <EmptyField />
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Learning Preferences (existing) */}
                <div className="space-y-4 border-t pt-6">
                  <h3 className="text-lg font-semibold">Learning Preferences</h3>
                  {profile?.learningPreferences ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Grade Level
                        </label>
                        <p className="mt-1">
                          {profile.learningPreferences.gradeLevel ? (
                            profile.learningPreferences.gradeLevel
                          ) : (
                            <Placeholder />
                          )}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Subjects of Interest
                        </label>
                        <p className="mt-1">
                          {profile.learningPreferences.subjectsOfInterest &&
                          profile.learningPreferences.subjectsOfInterest.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {profile.learningPreferences.subjectsOfInterest.map(
                                (subject, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-0.5 text-sm font-medium text-blue-700"
                                  >
                                    {subject}
                                  </span>
                                )
                              )}
                            </div>
                          ) : (
                            <Placeholder />
                          )}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">
                      No learning preferences set yet
                    </p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default MyProfile;
