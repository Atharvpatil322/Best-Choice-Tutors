/**
 * Tutor Profile View Page
 * Phase 3.3: Public tutor profile view
 * 
 * Displays tutor profile information (read-only)
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getTutorById } from '@/services/tutorService';

function TutorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTutor = async () => {
      try {
        setLoading(true);
        const data = await getTutorById(id);
        setTutor(data.tutor);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to load tutor profile');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTutor();
    }
  }, [id]);

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  // Placeholder for missing data
  const Placeholder = ({ text }) => (
    <span className="text-muted-foreground italic">{text || 'Not provided'}</span>
  );

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
            <CardContent className="p-6">
              <p className="text-center text-red-600">Error: {error}</p>
              <div className="mt-4 flex justify-center gap-2">
                <Button variant="outline" onClick={handleBack}>
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="container mx-auto max-w-4xl">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">Tutor not found</p>
              <div className="mt-4 flex justify-center gap-2">
                <Button variant="outline" onClick={handleBack}>
                  Go Back
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
          <h1 className="text-3xl font-bold">Tutor Profile</h1>
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
        </div>

        {/* Tutor Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Tutor Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Photo and Name */}
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="flex-shrink-0">
                {tutor.profilePhoto ? (
                  <img
                    src={tutor.profilePhoto}
                    alt={tutor.fullName}
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
                  {tutor.fullName || <Placeholder text="Name not provided" />}
                </h2>
                <p className="text-muted-foreground">
                  {tutor.mode || <Placeholder />}
                </p>
              </div>
            </div>

            {/* Bio */}
            {tutor.bio && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-2">About</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{tutor.bio}</p>
              </div>
            )}

            {/* Professional Details */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-semibold">Professional Details</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Education</label>
                  <p className="mt-1">
                    {tutor.education || <Placeholder />}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Years of Experience
                  </label>
                  <p className="mt-1">
                    {tutor.experienceYears !== undefined && tutor.experienceYears !== null ? (
                      `${tutor.experienceYears} ${tutor.experienceYears === 1 ? 'year' : 'years'}`
                    ) : (
                      <Placeholder />
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Hourly Rate</label>
                  <p className="mt-1">
                    {tutor.hourlyRate !== undefined && tutor.hourlyRate !== null ? (
                      `£${parseFloat(tutor.hourlyRate).toFixed(2)}/hour`
                    ) : (
                      <Placeholder />
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Teaching Mode</label>
                  <p className="mt-1">
                    {tutor.mode || <Placeholder />}
                  </p>
                </div>
                {tutor.location && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Location</label>
                    <p className="mt-1">
                      {tutor.location}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Subjects */}
            {tutor.subjects && tutor.subjects.length > 0 && (
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-semibold">Subjects</h3>
                <div className="flex flex-wrap gap-2">
                  {tutor.subjects.map((subject, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-0.5 text-sm font-medium text-blue-700"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default TutorProfile;
