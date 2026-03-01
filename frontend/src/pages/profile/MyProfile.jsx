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
import { CountryCodePicker } from '@/components/ui/country-code-picker';
import { getLearnerProfile, updateLearnerProfile } from '@/services/learnerProfileService';
import { SubjectSelector } from '@/components/SubjectSelector';
import { logout, getCurrentRole, getStoredUser, setUser } from '@/services/authService';
import { toast } from 'sonner';
import { Pencil, Camera, MapPin, Save, X, Phone, Mail, Book, Target, ChevronRight, Trash2 } from 'lucide-react';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import "../../styles/Profile.css";
import { ProfileAvatar } from '@/components/ProfileAvatar';

function MyProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [removeProfilePhoto, setRemoveProfilePhoto] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: { countryCode: '', number: '' },
    profilePhoto: null,
    profilePhotoPreview: null,
    gender: '',
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
          gender: data.gender === 'MALE' || data.gender === 'FEMALE' ? data.gender : '',
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
    setRemoveProfilePhoto(false);
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
      gender: profile?.gender === 'MALE' || profile?.gender === 'FEMALE' ? profile.gender : '',
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

      setRemoveProfilePhoto(false);
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

  const handleRemovePhoto = () => {
    setFormData((prev) => ({
      ...prev,
      profilePhoto: null,
      profilePhotoPreview: null,
    }));
    setRemoveProfilePhoto(true);
    if (validationErrors.profilePhoto) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next.profilePhoto;
        return next;
      });
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
        gender: formData.gender === 'MALE' || formData.gender === 'FEMALE' ? formData.gender : null,
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
      if (removeProfilePhoto) {
        updateData.clearProfilePhoto = true;
      }

      const updatedProfile = await updateLearnerProfile(updateData);

      setProfile(updatedProfile);
      setIsEditing(false);
      setSuccessMessage('Profile updated successfully!');
      toast.success('Your profile has been updated.');
      const stored = getStoredUser();
      if (stored) {
        const newPhoto = updatedProfile.profilePhoto ?? stored.profilePhoto;
        setUser({ ...stored, profilePhoto: newPhoto });
        window.dispatchEvent(new CustomEvent('profilePhotoUpdated'));
      }

      const dobVal = updatedProfile.dob;
      const dobStr = !dobVal ? '' : (typeof dobVal === 'string' ? dobVal.slice(0, 10) : new Date(dobVal).toISOString().slice(0, 10));
      setRemoveProfilePhoto(false);
      setFormData((prev) => ({
        ...prev,
        profilePhoto: null,
        profilePhotoPreview: updatedProfile.profilePhoto || null,
        gender: updatedProfile.gender === 'MALE' || updatedProfile.gender === 'FEMALE' ? updatedProfile.gender : '',
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
  <div className="profile-page-content">
    <div className="profile-intro">
      <h1 className="text-2xl font-bold text-[#1a365d]">
        {isEditing ? 'Edit Your Student Profile' : 'Create Your Student Profile'}
      </h1>
      <p className="text-sm text-slate-500">Set in your professional details to manage your profile</p>
    </div>

    {/* Hero Profile Card */}
    <div className="profile-hero-banner mt-6">
      <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-6">
        <div className="relative shrink-0 w-32 h-32 sm:w-28 sm:h-28 md:w-24 md:h-24 flex items-center justify-center">
          <ProfileAvatar
            src={!removeProfilePhoto && (formData.profilePhotoPreview || profile?.profilePhoto) ? (formData.profilePhotoPreview || profile?.profilePhoto) : null}
            alt="Profile"
            className="w-32 h-32 sm:w-28 sm:h-28 md:w-24 md:h-24 rounded-full border-4 border-white/20 object-cover object-center"
            iconClassName="w-14 h-14 sm:w-12 sm:h-12 text-white/80"
            fallbackClassName="bg-white/10"
          />
          {isEditing && (
            <>
              <label className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full cursor-pointer shadow-md hover:scale-110 transition-transform" title="Change photo">
                <Camera size={14} className="text-[#1a365d]" />
                <input type="file" accept="image/*" hidden onChange={handlePhotoChange} />
              </label>
              {(profile?.profilePhoto || formData.profilePhoto) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute bottom-0 left-0 p-1.5 bg-white rounded-full shadow-md h-8 w-8 min-w-8 hover:bg-slate-100 border border-slate-200 shrink-0 text-[#1a365d]"
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
          <h2 className="text-xl sm:text-2xl font-bold text-white truncate sm:whitespace-normal">{profile?.name || 'Alex Dior!'}</h2>
          <p className="flex items-center justify-center sm:justify-start gap-1 text-white/80 text-sm mt-1">
            <MapPin size={14} className="shrink-0" /> <span className="truncate">{profile?.address || 'Location not set'}</span>
          </p>
        </div>
      </div>
      {isEditing ? (
        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
          <Button onClick={handleSubmit} disabled={saving} className="bg-white text-[#1a365d] hover:bg-slate-100 font-semibold px-4 sm:px-6 rounded-lg">
            <Save size={14} className="mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button onClick={handleCancel} variant="ghost" className="text-white hover:bg-white/10">
            <X size={14} className="mr-2" /> Cancel
          </Button>
        </div>
      ) : (
        <Button onClick={handleEdit} className="bg-white text-[#1a365d] hover:bg-slate-100 font-semibold p-2.5 sm:px-6 sm:py-2 rounded-lg" aria-label="Edit profile">
          <Pencil size={18} className="sm:mr-2 sm:w-[14px] sm:h-[14px]" />
          <span className="hidden sm:inline">Edit Profile</span>
        </Button>
      )}
    </div>

    <div className="space-y-6 mt-6 pb-12">
      {/* Personal Information Section */}
      <Card className="profile-section-card">
        <div className="section-header">
          <h3>Personal Information</h3>
        </div>
        <div className="section-grid">
          <div className="info-block">
            <Label>Full Name</Label>
            {isEditing ? (
              <Input name="name" value={formData.name} onChange={handleInputChange} className="mt-1" />
            ) : <p>{profile?.name}</p>}
          </div>
          <div className="info-block">
            <Label>Email</Label>
            <p className="mt-2 opacity-60">{profile?.email}</p>
          </div>
          <div className="info-block">
            <Label>Gender</Label>
            {isEditing ? (
              <Select value={formData.gender || '__none__'} onValueChange={(v) => setFormData((prev) => ({ ...prev, gender: v === '__none__' ? '' : v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select gender..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Select gender...</SelectItem>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                </SelectContent>
              </Select>
            ) : <p>{profile?.gender === 'MALE' ? 'Male' : profile?.gender === 'FEMALE' ? 'Female' : 'Not set'}</p>}
          </div>
          <div className="info-block">
            <Label>Preferred Language</Label>
            {isEditing ? (
              <Input name="preferredLanguage" value={formData.preferredLanguage} onChange={handleInputChange} className="mt-1" />
            ) : <p>{profile?.preferredLanguage || 'English'}</p>}
          </div>
          <div className="info-block">
            <Label>Date of Birth</Label>
            {isEditing ? (
              <Input name="dob" type="date" value={formData.dob} onChange={handleInputChange} className="mt-1" />
            ) : <p>{formatDob(profile?.dob) || 'Not set'}</p>}
          </div>
          <div className="info-block">
            <Label>Phone Number</Label>
            {isEditing ? (
               <div className="flex gap-2 mt-1">
                  <CountryCodePicker
                    value={formData.phone.countryCode || ''}
                    onChange={handlePhoneCountryCodeChange}
                    placeholder="—"
                  />
                  <Input name="phoneNumber" value={formData.phone.number} onChange={handleInputChange} className="flex-1" />
               </div>
            ) : (
              <p>
                {[profile?.phone?.countryCode, profile?.phone?.number].filter(Boolean).join(' ') || 'Not set'}
              </p>
            )}
          </div>
          <div className="info-block">
            <Label>Location / Address</Label>
            {isEditing ? (
              <Input name="address" value={formData.address} onChange={handleInputChange} className="mt-1" />
            ) : <p>{profile?.address || 'Not set'}</p>}
          </div>
        </div>
      </Card>

      {/* Academic Information Section */}
      <Card className="profile-section-card">
        <div className="section-header">
          <h3>Academic Information</h3>
        </div>
        <div className="section-grid">
          <div className="info-block">
            <Label>Current School</Label>
            {isEditing ? (
              <Input name="instituteName" value={formData.instituteName} onChange={handleInputChange} className="mt-1" />
            ) : <p>{profile?.learningPreferences?.instituteName || 'Not set'}</p>}
          </div>
          <div className="info-block col-span-2">
            <Label>Subjects of Interest</Label>
            {isEditing ? (
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
            ) : <p>{profile?.learningPreferences?.subjectsOfInterest?.join(', ') || 'Not set'}</p>}
          </div>
          <div className="info-block">
            <Label>Grade Level</Label>
            {isEditing ? (
              <Select value={formData.gradeLevel || GRADE_NONE} onValueChange={handleGradeLevelChange}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {gradeLevels.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : <p>{profile?.learningPreferences?.gradeLevel || 'Not set'}</p>}
          </div>
          <div className="info-block col-span-2">
            <Label>Learning Goal</Label>
            {isEditing ? (
              <textarea 
                name="learningGoal" 
                value={formData.learningGoal} 
                onChange={handleInputChange}
                className="w-full mt-1 p-3 text-sm border rounded-lg focus:ring-2 focus:ring-[#1a365d] outline-none"
                rows={3}
              />
            ) : <p>{profile?.learningPreferences?.learningGoal || 'Not set'}</p>}
          </div>
        </div>
      </Card>
    </div>
  </div>
);
}

export default MyProfile;
