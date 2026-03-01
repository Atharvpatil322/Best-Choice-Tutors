/**
 * Create Tutor Profile Page
 * Styling aligned with TutorMyProfile (profile-section-card, section-header, #1A365D).
 */

import { useState } from 'react';
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
import { createTutorProfile } from '@/services/tutorService';
import { getStoredUser, getCurrentRole, logout } from '@/services/authService';
import { toast } from 'sonner';
import { SubjectSelector } from '@/components/SubjectSelector';
import '../../styles/Profile.css';

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
    qualifications: [{ title: '', institution: '', year: '' }],
    experienceYears: '',
    hourlyRate: '',
    mode: '',
    location: '',
    profilePhoto: null,
    profilePhotoPreview: null,
  });

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
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleQualificationChange = (index, field, value) => {
    setFormData((prev) => {
      const next = [...(prev.qualifications || [])];
      if (!next[index]) next[index] = { title: '', institution: '', year: '' };
      next[index] = { ...next[index], [field]: value };
      return { ...prev, qualifications: next };
    });
    if (validationErrors.qualifications) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next.qualifications;
        return next;
      });
    }
  };

  const addQualification = () => {
    setFormData((prev) => ({
      ...prev,
      qualifications: [...(prev.qualifications || []), { title: '', institution: '', year: '' }],
    }));
  };

  const removeQualification = (index) => {
    setFormData((prev) => {
      const next = (prev.qualifications || []).filter((_, i) => i !== index);
      return { ...prev, qualifications: next.length ? next : [{ title: '', institution: '', year: '' }] };
    });
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
      const qualifications = (formData.qualifications || [])
        .map((q) => ({
          title: (q.title || '').trim(),
          institution: (q.institution || '').trim(),
          year: (q.year || '').trim(),
        }))
        .filter((q) => q.title || q.institution || q.year);
      if (qualifications.length === 0) {
        setValidationErrors((prev) => ({ ...prev, qualifications: 'At least one qualification is required' }));
        setSubmitting(false);
        return;
      }
      const expYears = parseInt(formData.experienceYears, 10);
      if (!Number.isInteger(expYears) || expYears < 0) {
        setValidationErrors((prev) => ({ ...prev, experienceYears: 'Years of experience must be a non-negative number' }));
        setSubmitting(false);
        return;
      }
      const tutorData = {
        fullName: formData.fullName.trim(),
        bio: formData.bio.trim(),
        subjects: formData.subjects,
        qualifications,
        experienceYears: expYears,
        hourlyRate: parseFloat(formData.hourlyRate),
        mode: formData.mode,
        location: formData.location.trim() || null,
      };

      if (formData.profilePhoto) {
        tutorData.profilePhoto = formData.profilePhoto;
      }

      const result = await createTutorProfile(tutorData);

      setSuccessMessage('Tutor profile created successfully!');
      toast.success('Tutor profile created. Add your availability to start receiving bookings.', {
        description: 'Go to Manage Availability to set your weekly schedule.',
      });

      // Role sync (frontend): mark user as Tutor for role-based UI gating
      // (Role persistence is the backend source of truth; this improves immediate UX.)
      try {
        const existing = getStoredUser();
        if (existing) {
          localStorage.setItem('auth_user', JSON.stringify({ ...existing, role: 'Tutor' }));
        }
      } catch {
        // ignore
      }
      
      // Redirect to tutor dashboard after a short delay
      setTimeout(() => {
        navigate('/tutor');
      }, 2000);
    } catch (err) {
      if (err.errors) {
        // Validation errors from backend
        setValidationErrors(err.errors);
        setError(err.message || 'Validation failed');
      } else {
        setError(err.message || 'Failed to create tutor profile');
        // If unauthorized, redirect to landing page
        if (err.message.includes('Authentication') || err.message.includes('401')) {
          logout();
          navigate('/', { replace: true });
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    const role = getCurrentRole();
    const isTutor = typeof role === 'string' && role.toLowerCase() === 'tutor';
    navigate(isTutor ? '/tutor' : '/dashboard');
  };

  return (
    <div className="profile-page-content">
      <div className="profile-intro">
        <h1 className="text-2xl font-bold text-[#1A365D]">Create Tutor Profile</h1>
        <p className="text-sm text-slate-500">Set up your professional tutor profile so learners can find and book you</p>
      </div>

      {/* Success */}
      {successMessage && (
        <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800 text-sm font-medium">
          {successMessage}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 text-sm font-medium">
          {error}
        </div>
      )}

      <Card className="profile-section-card mt-6">
        <div className="section-header">
          <h3>Tutor profile information</h3>
        </div>
        <form onSubmit={handleSubmit} className="section-grid">
          {/* Profile photo */}
          <div className="info-block col-span-3 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-shrink-0">
              {formData.profilePhotoPreview ? (
                <img
                  src={formData.profilePhotoPreview}
                  alt="Profile preview"
                  className="h-24 w-24 rounded-full object-cover border-2 border-slate-200"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-slate-200 bg-slate-100 text-slate-400">
                  <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <Label htmlFor="profilePhoto">Profile photo</Label>
              <Input
                id="profilePhoto"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="mt-1 max-w-xs"
              />
              {validationErrors.profilePhoto && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.profilePhoto}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">Optional. Max 5MB. JPG, PNG, or WebP.</p>
            </div>
          </div>

          <div className="info-block">
            <Label htmlFor="fullName">Full name *</Label>
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
              <p className="mt-1 text-xs text-red-600">{validationErrors.fullName}</p>
            )}
          </div>

          <div className="info-block col-span-2">
            <Label htmlFor="bio">Teaching bio *</Label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              required
              rows={4}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#1a365d]"
              placeholder="Describe your teaching style and what learners can expect."
            />
            {validationErrors.bio && (
              <p className="mt-1 text-xs text-red-600">{validationErrors.bio}</p>
            )}
          </div>

          <div className="info-block col-span-3">
            <Label>Subjects *</Label>
            <p className="mt-1 text-xs text-muted-foreground mb-2">Select all subjects you can teach.</p>
            <SubjectSelector
              value={formData.subjects}
              onChange={(subjects) => {
                setFormData((prev) => ({ ...prev, subjects }));
                if (validationErrors.subjects) {
                  setValidationErrors((prev) => {
                    const next = { ...prev };
                    delete next.subjects;
                    return next;
                  });
                }
              }}
            />
            {validationErrors.subjects && (
              <p className="mt-1 text-xs text-red-600">{validationErrors.subjects}</p>
            )}
          </div>

          <div className="info-block col-span-3">
            <Label>Qualifications *</Label>
            <p className="mt-1 text-xs text-muted-foreground mb-2">Add at least one qualification (title, institution, or year).</p>
            <div className="space-y-3">
              {(formData.qualifications || []).map((q, index) => (
                <div key={index} className="flex flex-wrap items-end gap-2 rounded-md border border-input p-3">
                  <div className="grid flex-1 gap-2 min-w-0 sm:grid-cols-3">
                    <div>
                      <Label htmlFor={`qual-title-${index}`} className="text-xs">Title</Label>
                      <Input
                        id={`qual-title-${index}`}
                        placeholder="e.g. BSc Mathematics"
                        value={q.title || ''}
                        onChange={(e) => handleQualificationChange(index, 'title', e.target.value)}
                        className="mt-1 h-9"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`qual-institution-${index}`} className="text-xs">Institution</Label>
                      <Input
                        id={`qual-institution-${index}`}
                        placeholder="e.g. University of London"
                        value={q.institution || ''}
                        onChange={(e) => handleQualificationChange(index, 'institution', e.target.value)}
                        className="mt-1 h-9"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`qual-year-${index}`} className="text-xs">Year</Label>
                      <Input
                        id={`qual-year-${index}`}
                        placeholder="e.g. 2020"
                        value={q.year || ''}
                        onChange={(e) => handleQualificationChange(index, 'year', e.target.value)}
                        className="mt-1 h-9"
                      />
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeQualification(index)} className="text-destructive hover:text-destructive shrink-0">
                    Remove
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addQualification} className="rounded-lg">
                Add more
              </Button>
            </div>
            {validationErrors.qualifications && (
              <p className="mt-1 text-xs text-red-600">{validationErrors.qualifications}</p>
            )}
          </div>

          <div className="info-block">
            <Label htmlFor="experienceYears">Years of experience *</Label>
            <Input
              id="experienceYears"
              name="experienceYears"
              type="number"
              min="0"
              value={formData.experienceYears}
              onChange={handleInputChange}
              required
              className="mt-1"
              placeholder="e.g. 5"
            />
            {validationErrors.experienceYears && (
              <p className="mt-1 text-xs text-red-600">{validationErrors.experienceYears}</p>
            )}
          </div>

          <div className="info-block">
            <Label htmlFor="hourlyRate">Hourly rate (£) *</Label>
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
              placeholder="e.g. 25"
            />
            {validationErrors.hourlyRate && (
              <p className="mt-1 text-xs text-red-600">{validationErrors.hourlyRate}</p>
            )}
          </div>

          <div className="info-block">
            <Label htmlFor="mode">Teaching mode *</Label>
            <Select value={formData.mode} onValueChange={handleModeChange}>
              <SelectTrigger className="mt-1" id="mode">
                <SelectValue placeholder="Select mode..." />
              </SelectTrigger>
              <SelectContent>
                {teachingModes.map((mode) => (
                  <SelectItem key={mode.value} value={mode.value}>{mode.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validationErrors.mode && (
              <p className="mt-1 text-xs text-red-600">{validationErrors.mode}</p>
            )}
          </div>

          {(formData.mode === 'In-Person' || formData.mode === 'Both') && (
            <div className="info-block">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                type="text"
                value={formData.location}
                onChange={handleInputChange}
                className="mt-1"
                placeholder="e.g. London, UK or postcode"
              />
              {validationErrors.location && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.location}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">Required for in-person teaching.</p>
            </div>
          )}

          <div className="info-block col-span-3 flex flex-wrap gap-3 border-t border-slate-100 pt-6 mt-2">
            <Button
              type="submit"
              disabled={submitting}
              className="bg-[#1A365D] hover:bg-[#1A365D]/90 text-white font-semibold px-6 rounded-lg"
            >
              {submitting ? 'Creating...' : 'Create tutor profile'}
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={submitting} className="rounded-lg">
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default CreateTutorProfile;
