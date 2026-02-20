import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MyProfile from './MyProfile';
import TutorProfile from '@/pages/tutor/TutorProfile';
import { getCurrentRole, getCurrentUser } from '@/services/authService';
import { getAllTutors } from '@/services/tutorService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * ProfileRouter
 * Role-aware dispatcher for /profile
 *
 * - Learner  -> renders learner profile
 * - Tutor    -> renders own tutor profile
 */
function ProfileRouter() {
  const navigate = useNavigate();
  const role = getCurrentRole();
  const normalizedRole = typeof role === 'string' ? role.toLowerCase() : null;

  const [state, setState] = useState({
    loading: normalizedRole === 'tutor',
    error: null,
    tutorId: null,
  });

  useEffect(() => {
    const fetchTutorForCurrentUser = async () => {
      try {
        const currentUser = getCurrentUser();
        if (!currentUser?.id) {
          setState({
            loading: false,
            error: 'Unable to determine current user for tutor profile.',
            tutorId: null,
          });
          return;
        }

        const data = await getAllTutors();
        const tutors = data?.tutors || [];
        const match = tutors.find((tutor) => tutor.userId === currentUser.id);

        if (!match) {
          setState({
            loading: false,
            error: 'Tutor profile not found. Please create your tutor profile.',
            tutorId: null,
          });
          return;
        }

        setState({
          loading: false,
          error: null,
          tutorId: match.id,
        });
      } catch (err) {
        setState({
          loading: false,
          error: err.message || 'Failed to load tutor profile.',
          tutorId: null,
        });
      }
    };

    if (normalizedRole === 'tutor') {
      fetchTutorForCurrentUser();
    } else {
      // Learners (or unknown role) don't need tutor lookup
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [normalizedRole]);

  // Default /profile for learners (and unknown role) -> learner profile
  if (normalizedRole !== 'tutor') {
    return <MyProfile />;
  }

  // Tutor branch
  if (state.loading) {
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

  if (state.error || !state.tutorId) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="container mx-auto max-w-4xl">
          <Card>
            <CardContent className="p-6 space-y-4">
              <p className="text-center text-red-600">
                {state.error || 'Tutor profile not found.'}
              </p>
              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={() => navigate('/tutor/create')}>
                  Create Tutor Profile
                </Button>
                <Button variant="outline" onClick={() => navigate('/tutor')}>
                  Go to Tutor Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Render own tutor profile using existing TutorProfile component
  return <TutorProfile tutorId={state.tutorId} />;
}

export default ProfileRouter;

