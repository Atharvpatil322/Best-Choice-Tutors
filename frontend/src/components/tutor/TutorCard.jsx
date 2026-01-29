/**
 * Tutor Card Component
 * Phase 3.4: Display tutor information in a card format
 */

import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function TutorCard({ tutor }) {
  const navigate = useNavigate();

  const handleViewProfile = () => {
    navigate(`/tutors/${tutor.id}`);
  };

  return (
    <Card className="flex flex-col hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            {/* Profile Photo */}
            <div className="flex-shrink-0">
              {tutor.profilePhoto ? (
                <img
                  src={tutor.profilePhoto}
                  alt={tutor.fullName}
                  className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 text-gray-400">
                  <svg
                    className="h-8 w-8"
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
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold truncate">{tutor.fullName}</h3>
              <p className="text-sm text-muted-foreground">{tutor.mode}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        {/* Bio Preview */}
        {tutor.bio && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {tutor.bio}
          </p>
        )}

        {/* Subjects */}
        {tutor.subjects && tutor.subjects.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tutor.subjects.slice(0, 3).map((subject, index) => (
              <span
                key={index}
                className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
              >
                {subject}
              </span>
            ))}
            {tutor.subjects.length > 3 && (
              <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                +{tutor.subjects.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Qualifications & Experience */}
        <div className="space-y-1 text-sm text-muted-foreground">
          {tutor.qualifications && tutor.qualifications.length > 0 && (
            <p className="truncate">
              {tutor.qualifications.map((q) => [q.title, q.institution, q.year].filter(Boolean).join(', ')).join('; ')}
            </p>
          )}
          {tutor.experienceYears !== undefined && tutor.experienceYears !== null && (
            <p>
              {tutor.experienceYears} {tutor.experienceYears === 1 ? 'year' : 'years'} of experience
            </p>
          )}
        </div>

        {/* Location */}
        {tutor.location && (
          <p className="text-sm text-muted-foreground">
            📍 {tutor.location}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t pt-4">
        <div>
          {tutor.hourlyRate !== undefined && tutor.hourlyRate !== null ? (
            <>
              <span className="text-2xl font-bold">£{parseFloat(tutor.hourlyRate).toFixed(2)}</span>
              <span className="text-sm text-muted-foreground">/hour</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">Rate not set</span>
          )}
        </div>
        <Button onClick={handleViewProfile} variant="outline">
          View Profile
        </Button>
      </CardFooter>
    </Card>
  );
}

export default TutorCard;
