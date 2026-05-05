import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle } from 'lucide-react';
import '../../styles/AgeConsent.css';

function AgeConsent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'learner';
  const isSignUp = searchParams.get('signup') === '1';
  const minimumAge = role === 'tutor' ? 18 : 13;
  const [meetsAgeRequirement, setMeetsAgeRequirement] = useState(true);

  const handleContinue = () => {
    if (meetsAgeRequirement) {
      if (isSignUp) {
        navigate(`/register?role=${role}`);
      } else {
        navigate(`/login?role=${role}`);
      }
    } else {
      toast.error(`You must be ${minimumAge} or over to create an account.`);
    }
  };

  return (
    <div className="age-consent-page">
      <div className="age-consent-overlay">
        <Card className="age-consent-card">
          <CardContent className="p-0 flex flex-col items-center">
            <h1 className="age-title">Age Confirmation</h1>
            <p className="age-subtitle">
              To create an Account on Best Choice Tutors, <br />
              <span className="font-bold">{`"You must be ${minimumAge} years or over"`}</span>
            </p>

            <div className="age-options-container">
              <div 
                className={`age-option ${meetsAgeRequirement ? 'selected' : ''}`}
                onClick={() => setMeetsAgeRequirement(true)}
              >
                {meetsAgeRequirement ? (
                  <CheckCircle2 className="text-green-500" size={24} />
                ) : (
                  <Circle className="text-gray-300" size={24} />
                )}
                <span>{`I am ${minimumAge} or over`}</span>
              </div>

              <div 
                className={`age-option ${!meetsAgeRequirement ? 'selected' : ''}`}
                onClick={() => setMeetsAgeRequirement(false)}
              >
                {!meetsAgeRequirement ? (
                  <CheckCircle2 className="text-green-500" size={24} />
                ) : (
                  <Circle className="text-gray-300" size={24} />
                )}
                <span>{`I am under ${minimumAge}`}</span>
              </div>
            </div>

            <div className="age-button-group">
              <Button 
                variant="outline" 
                className="btn-age-back"
                onClick={() => navigate(-1)}
              >
                Go Back
              </Button>
              <Button 
                className="btn-age-continue"
                onClick={handleContinue}
              >
                {isSignUp ? 'Continue to Sign up' : 'Continue'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AgeConsent;