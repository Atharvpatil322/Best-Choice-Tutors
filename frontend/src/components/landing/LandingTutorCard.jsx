/**
 * Landing page tutor card – square, standard UI.
 * Used only on the landing page hero section.
 */

import { useNavigate } from 'react-router-dom';
import { ChevronRight, CheckCircle, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { isAuthenticated } from '../../lib/auth';
import { ProfileAvatar } from '@/components/ProfileAvatar';

function LandingTutorCard({ tutor }) {
  const navigate = useNavigate();
  const primarySubject = tutor.subjects?.[0] || 'Tutor';
  const subjects = Array.isArray(tutor.subjects) ? tutor.subjects : [];

  const handleViewProfile = () => {
    if (isAuthenticated()) {
      navigate(`/dashboard/tutors/${tutor.id}`);
    } else {
      navigate('/login');
    }
  };

  return (
    <Card className="tutor-card-landing overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md h-full flex flex-col">
      <CardContent className="p-0 flex flex-col flex-1 min-h-0">
        {/* Top: photo – takes ~40% of card in square layout */}
        <div className="tutor-card-landing__photo overflow-hidden bg-slate-100">
          <ProfileAvatar
            src={tutor.profilePhoto}
            alt={tutor.fullName || 'Tutor'}
            className="h-full w-full object-cover"
            iconClassName="h-16 w-16 sm:h-20 sm:w-20 text-slate-400"
          />
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col p-4 min-h-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-slate-800 truncate" title={tutor.fullName || 'Tutor'}>
              {tutor.fullName || 'Tutor'}
            </h3>
            {tutor.isVerified && (
              <span className="inline-flex items-center rounded-full bg-emerald-100 p-0.5" title="Document verified">
                <CheckCircle size={14} className="text-emerald-600 shrink-0" />
              </span>
            )}
            {tutor.isDbsVerified && (
              <span className="inline-flex items-center rounded-full bg-blue-100 p-0.5" title="DBS verified">
                <ShieldCheck size={14} className="text-blue-600 shrink-0" />
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5 truncate">{primarySubject}</p>

          {/* Rate */}
          {tutor.hourlyRate !== undefined && tutor.hourlyRate !== null && (
            <p className="text-lg font-bold text-slate-800 mt-2">
              £{parseFloat(tutor.hourlyRate).toFixed(2)}
              <span className="text-sm font-normal text-slate-500">/hr</span>
            </p>
          )}

          {/* Subject tags – max 2 */}
          {subjects.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2 min-h-[1.5rem]">
              {subjects.slice(0, 2).map((subject, index) => (
                <span
                  key={index}
                  className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                >
                  {subject}
                </span>
              ))}
              {subjects.length > 2 && (
                <span className="text-xs text-slate-400">+{subjects.length - 2}</span>
              )}
            </div>
          )}

          {/* Spacer to push button to bottom */}
          <div className="flex-1 min-h-2" />

          {/* CTA */}
          <Button
            onClick={handleViewProfile}
            variant="default"
            className="w-full mt-3 rounded-lg h-9 text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white"
          >
            View Profile
            <ChevronRight size={16} className="ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default LandingTutorCard;
