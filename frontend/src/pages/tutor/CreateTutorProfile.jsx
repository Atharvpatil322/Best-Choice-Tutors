/**
 * Create Tutor Profile Page
 * Phase 3.2: Tutor profile creation UI
 * 
 * Allows authenticated users to create a tutor profile
 */

import { useState } from 'react';
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
import { createTutorProfile } from '@/services/tutorService';
import { logout } from '@/services/authService';

function CreateTutorProfile() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    bio: '',
    subjects: [],
    education: '',
    experienceYears: '',
    hourlyRate: '',
    mode: '',
    location: '',
    profilePhoto: null,
    profilePhotoPreview: null,
  });

  // Available subjects
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

  // Teaching modes
  const teachingModes = [
    { value: 'Online', label: 'Online' },
    { value: 'In-Person', label: 'In-Person' },
    { value: 'Both', label: 'Both' },
  ];

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

  const handleSubjectToggle = (subject) => {
    setFormData((prev) => {
      const currentSubjects = prev.subjects || [];
      const isSelected = currentSubjects.includes(subject);
      const newSubjects = isSelected
        ? currentSubjects.filter((s) => s !== subject)
        : [...currentSubjects, subject];

      return {
        ...prev,
        subjects: newSubjects,
      };
    });
    // Clear validation error
    if (validationErrors.subjects) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.subjects;
        return newErrors;
      });
    }
  };

  const handleModeChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      mode: value,
    }));
    // Clear validation error
    if (validationErrors.mode) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.mode;
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    setValidationErrors({});

    try {
      const tutorData = {
        fullName: formData.fullName.trim(),
        bio: formData.bio.trim(),
        subjects: formData.subjects,
        education: formData.education.trim(),
        experienceYears: parseInt(formData.experienceYears),
        hourlyRate: parseFloat(formData.hourlyRate),
        mode: formData.mode,
        location: formData.location.trim() || null,
      };

      if (formData.profilePhoto) {
        tutorData.profilePhoto = formData.profilePhoto;
      }

      const result = await createTutorProfile(tutorData);

      setSuccessMessage('Tutor profile created successfully!');
      
      // Redirect to tutor dashboard after a short delay
      setTimeout(() => {
        navigate('/tutor/dashboard');
      }, 2000);
    } catch (err) {
      if (err.errors) {
        // Validation errors from backend
        setValidationErrors(err.errors);
        setError(err.message || 'Validation failed');
      } else {
        setError(err.message || 'Failed to create tutor profile');
        // If unauthorized, redirect to login
        if (err.message.includes('Authentication') || err.message.includes('401')) {
          logout();
          navigate('/login');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Create Tutor Profile</h1>
          <p className="mt-2 text-muted-foreground">
            Set up your professional tutor profile to start teaching
          </p>
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

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Tutor Profile Information</CardTitle>
            <CardDescription>
              Fill in your professional details to create your tutor profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Photo */}
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

              {/* Full Name */}
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  className="mt-1"
                  placeholder="Enter your full name"
                />
                {validationErrors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.fullName}</p>
                )}
              </div>

              {/* Bio */}
              <div>
                <Label htmlFor="bio">Bio *</Label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Tell us about your teaching experience and approach..."
                />
                {validationErrors.bio && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.bio}</p>
                )}
              </div>

              {/* Subjects */}
              <div>
                <Label>Subjects *</Label>
                <p className="mt-1 text-xs text-muted-foreground mb-2">
                  Select all subjects you can teach
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {availableSubjects.map((subject) => {
                    const isSelected = formData.subjects.includes(subject);
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
                {validationErrors.subjects && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.subjects}</p>
                )}
              </div>

              {/* Education */}
              <div>
                <Label htmlFor="education">Education *</Label>
                <Input
                  id="education"
                  name="education"
                  type="text"
                  value={formData.education}
                  onChange={handleInputChange}
                  required
                  className="mt-1"
                  placeholder="e.g., BSc Mathematics, University of London"
                />
                {validationErrors.education && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.education}</p>
                )}
              </div>

              {/* Experience Years */}
              <div>
                <Label htmlFor="experienceYears">Years of Experience *</Label>
                <Input
                  id="experienceYears"
                  name="experienceYears"
                  type="number"
                  min="0"
                  value={formData.experienceYears}
                  onChange={handleInputChange}
                  required
                  className="mt-1"
                  placeholder="e.g., 5"
                />
                {validationErrors.experienceYears && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.experienceYears}</p>
                )}
              </div>

              {/* Hourly Rate */}
              <div>
                <Label htmlFor="hourlyRate">Hourly Rate (£) *</Label>
                <Input
                  id="hourlyRate"
                  name="hourlyRate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.hourlyRate}
                  onChange={handleInputChange}
                  required
                  className="mt-1"
                  placeholder="e.g., 25.00"
                />
                {validationErrors.hourlyRate && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.hourlyRate}</p>
                )}
              </div>

              {/* Teaching Mode */}
              <div>
                <Label htmlFor="mode">Teaching Mode *</Label>
                <Select value={formData.mode} onValueChange={handleModeChange}>
                  <SelectTrigger className="mt-1" id="mode">
                    <SelectValue placeholder="Select teaching mode..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teachingModes.map((mode) => (
                      <SelectItem key={mode.value} value={mode.value}>
                        {mode.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.mode && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.mode}</p>
                )}
              </div>

              {/* Location (conditional) */}
              {(formData.mode === 'In-Person' || formData.mode === 'Both') && (
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    type="text"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="mt-1"
                    placeholder="e.g., London, UK or SW1A 1AA"
                  />
                  {validationErrors.location && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.location}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Optional. Provide your location for in-person sessions.
                  </p>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex gap-2 border-t pt-4">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Creating Profile...' : 'Create Tutor Profile'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel} disabled={submitting}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default CreateTutorProfile;
