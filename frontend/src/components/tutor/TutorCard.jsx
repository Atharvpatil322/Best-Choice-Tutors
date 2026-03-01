/**
 * Tutor Card Component
 * Horizontal layout with rich details: subjects, qualifications, experience, location/mode.
 */

import { useNavigate } from 'react-router-dom';
import { Star, ChevronRight, MapPin, GraduationCap, Briefcase, CheckCircle, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { isAuthenticated } from '../../lib/auth';
import { ProfileAvatar } from '@/components/ProfileAvatar';

function TutorCard({ tutor }) {
  const navigate = useNavigate();
  const hasReviews = tutor.reviewCount != null && tutor.reviewCount > 0;
  const primarySubject = tutor.subjects?.[0] || 'Tutor';
  const subjects = Array.isArray(tutor.subjects) ? tutor.subjects : [];
  const qualifications = Array.isArray(tutor.qualifications) ? tutor.qualifications : [];
  const qualSummary = qualifications.length > 0
    ? qualifications.map((q) => [q.title, q.institution].filter(Boolean).join(', ')).join(' · ')
    : null;
  const experienceYears = tutor.experienceYears != null && tutor.experienceYears !== ''
    ? Number(tutor.experienceYears)
    : null;
  const locationText = typeof tutor.location === 'string'
    ? tutor.location
    : tutor.location?.address || tutor.location?.city || null;
  const mode = tutor.mode || null;

  const handleViewProfile = () => {
    if (isAuthenticated()) {
      navigate(`/dashboard/tutors/${tutor.id}`);
    } else {
      navigate('/login');
    }
  };

  return (
    <Card className="overflow-hidden rounded-2xl border border-[#E2E8F0] shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-all hover:border-[#CBD5E0]">
      <CardContent className="p-6 flex flex-col lg:flex-row gap-6">
        {/* Left: Avatar + main info */}
        <div className="flex gap-5 flex-1 min-w-0">
          <ProfileAvatar
            src={tutor.profilePhoto}
            alt={tutor.fullName || 'Tutor'}
            className="w-20 h-20 rounded-full object-cover flex-shrink-0 border-2 border-slate-100"
          />
          <div className="min-w-0 flex-1 space-y-3">
            {/* Name + price row */}
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-bold text-[#1A365D]">{tutor.fullName || 'Tutor'}</h3>
                  {tutor.isVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700" title="Document verified">
                      <CheckCircle size={14} className="shrink-0" />
                      Verified
                    </span>
                  )}
                  {tutor.isDbsVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700" title="DBS verified">
                      <ShieldCheck size={14} className="shrink-0" />
                      DBS
                    </span>
                  )}
                </div>
                <p className="text-[#1A365D] font-medium text-sm mt-0.5">{primarySubject}</p>
              </div>
              {tutor.hourlyRate !== undefined && tutor.hourlyRate !== null && (
                <div className="text-right">
                  <span className="text-2xl font-bold text-[#1A365D]">
                    £{parseFloat(tutor.hourlyRate).toFixed(2)}
                  </span>
                  <span className="text-sm text-slate-500 ml-1">/hour</span>
                </div>
              )}
            </div>

            {/* Rating */}
            {hasReviews && (
              <div className="flex items-center gap-2 text-sm">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Star
                      key={value}
                      className={`h-4 w-4 ${
                        value <= Math.round(Number(tutor.averageRating) || 0)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-slate-500">
                  {(Number(tutor.averageRating) || 0).toFixed(1)} · {tutor.reviewCount}{' '}
                  {tutor.reviewCount === 1 ? 'review' : 'reviews'}
                </span>
              </div>
            )}

            {/* Subject tags */}
            {subjects.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {subjects.slice(0, 5).map((subject, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-[#1A365D]"
                  >
                    {subject}
                  </span>
                ))}
                {subjects.length > 5 && (
                  <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                    +{subjects.length - 5} more
                  </span>
                )}
              </div>
            )}

            {/* Bio */}
            {tutor.bio && (
              <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{tutor.bio}</p>
            )}

            {/* Meta row: location, experience, qualifications */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 pt-1 border-t border-slate-100">
              {mode && (
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </span>
                  {mode}
                </span>
              )}
              {locationText && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="truncate max-w-[200px]">{locationText}</span>
                </span>
              )}
              {experienceYears !== null && experienceYears >= 0 && (
                <span className="flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-slate-400 shrink-0" />
                  {experienceYears} {experienceYears === 1 ? 'year' : 'years'} experience
                </span>
              )}
              {qualSummary && (
                <span className="flex items-center gap-1.5 min-w-0">
                  <GraduationCap className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="truncate max-w-[240px]" title={qualSummary}>{qualSummary}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Action */}
        <div className="flex flex-col justify-center shrink-0 lg:min-w-[200px]">
          <Button
            onClick={handleViewProfile}
            className="w-full bg-[#1A365D] text-white rounded-xl h-11 font-bold hover:bg-[#1A365D]/90 shadow-sm"
          >
            View Profile
            <ChevronRight size={18} className="ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default TutorCard;
