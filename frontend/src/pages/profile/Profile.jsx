/**
 * Learner Profile View Page
 * FR-4.1.1, FR-4.1.2, UC-4.1: Read-only display and editing of learner profile information
 * 
 * Displays:
 * - Name
 * - Email
 * - Profile photo (or placeholder)
 * - Learning preferences (if present)
 * - Account creation date
 * 
 * Allows editing:
 * - Name
 * - Profile photo
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
import { toast } from 'sonner';
import { logout, getCurrentRole } from '@/services/authService';
import { SubjectSelector } from '@/components/SubjectSelector';

function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Form state for editing
  const [formData, setFormData] = useState({
    name: '',
    profilePhoto: null, // File object
    profilePhotoPreview: null, // URL for preview
    gradeLevel: '',
    subjectsOfInterest: [], // Array of selected subjects
  });

  // Available grade levels (UK-based)
  const gradeLevels = [
    { value: '', label: 'Select grade level...' },
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
        // Initialize form data with learning preferences
        setFormData({
          name: data.name || '',
          profilePhoto: null,
          profilePhotoPreview: data.profilePhoto || null,
          gradeLevel: data.learningPreferences?.gradeLevel || '',
          subjectsOfInterest: data.learningPreferences?.subjectsOfInterest || [],
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
    // Reset form data to current profile values including learning preferences
    setFormData({
      name: profile?.name || '',
      profilePhoto: null,
      profilePhotoPreview: profile?.profilePhoto || null,
      gradeLevel: profile?.learningPreferences?.gradeLevel || '',
      subjectsOfInterest: profile?.learningPreferences?.subjectsOfInterest || [],
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data to current profile values including learning preferences
    setFormData({
      name: profile?.name || '',
      profilePhoto: null,
      profilePhotoPreview: profile?.profilePhoto || null,
      gradeLevel: profile?.learningPreferences?.gradeLevel || '',
      subjectsOfInterest: profile?.learningPreferences?.subjectsOfInterest || [],
    });
    setValidationErrors({});
    setSuccessMessage(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
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
      gradeLevel: value,
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


  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    setValidationErrors({});

    try {
      const updateData = {
        name: formData.name.trim(),
        gradeLevel: formData.gradeLevel || null, // Learning preferences
        subjectsOfInterest: formData.subjectsOfInterest || [], // Learning preferences
      };

      if (formData.profilePhoto) {
        updateData.profilePhoto = formData.profilePhoto;
      }

      const updatedProfile = await updateLearnerProfile(updateData);

      // Update profile state
      setProfile(updatedProfile);
      setIsEditing(false);
      setSuccessMessage('Profile updated successfully!');
      toast.success('Your profile has been updated.');

      // Reset form photo file and update learning preferences (keep preview from updated profile)
      setFormData((prev) => ({
        ...prev,
        profilePhoto: null,
        profilePhotoPreview: updatedProfile.profilePhoto || null,
        gradeLevel: updatedProfile.learningPreferences?.gradeLevel || '',
        subjectsOfInterest: updatedProfile.learningPreferences?.subjectsOfInterest || [],
      }));
    } catch (err) {
      if (err.errors) {
        setValidationErrors(err.errors);
        setError(err.message || 'Validation failed');
        toast.error(err.message || 'Could not update profile. Please check the form.');
      } else {
        setError(err.message || 'Failed to update profile');
        toast.error(err.message || 'Could not update profile. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Placeholder for missing data
  const Placeholder = ({ text }) => (
    <span className="text-muted-foreground italic">{text || 'Not provided'}</span>
  );

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return null;
    }
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

  if (error) {
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

                {/* Learning Preferences Section */}
                <div className="space-y-4 border-t pt-6">
                  <h3 className="text-lg font-semibold">Learning Preferences</h3>
                  <p className="text-sm text-muted-foreground">
                    Optional. Help us match you with the right tutors.
                  </p>

                  {/* Grade Level Dropdown */}
                  <div>
                    <Label htmlFor="gradeLevel">Grade Level</Label>
                    <Select
                      value={formData.gradeLevel}
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
                    <div className="mt-2">
                      <SubjectSelector
                        value={formData.subjectsOfInterest}
                        onChange={(subjects) => {
                          setFormData((prev) => ({ ...prev, subjectsOfInterest: subjects }));
                          if (validationErrors.subjectsOfInterest) {
                            setValidationErrors((prev) => {
                              const next = { ...prev };
                              delete next.subjectsOfInterest;
                              return next;
                            });
                          }
                        }}
                      />
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
                {/* Profile Photo and Name */}
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
                  <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                  <p className="mt-1">
                    {profile?.phone && (profile.phone.countryCode || profile.phone.number) ? (
                      [profile.phone.countryCode, profile.phone.number].filter(Boolean).join(' ')
                    ) : (
                      <Placeholder />
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Account Created
                  </label>
                  <p className="mt-1">
                    {/* TODO: Backend API should include createdAt field in response */}
                    {profile?.createdAt ? (
                      formatDate(profile.createdAt)
                    ) : (
                      <Placeholder text="Not available" />
                    )}
                  </p>
                </div>
              </div>
            </div>

                {/* Learning Preferences (Read-only in both modes) */}
                {profile?.learningPreferences && (
                  <div className="space-y-4 border-t pt-6">
                    <h3 className="text-lg font-semibold">Learning Preferences</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Grade Level</label>
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
                            <Placeholder />
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Show message if no learning preferences */}
                {!profile?.learningPreferences && (
                  <div className="border-t pt-6">
                    <p className="text-muted-foreground italic">
                      No learning preferences set yet
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Profile;
