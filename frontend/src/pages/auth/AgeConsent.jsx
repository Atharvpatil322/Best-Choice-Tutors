import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle } from 'lucide-react';
import '../../styles/AgeConsent.css';

function AgeConsent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'learner';
  const isSignUp = searchParams.get('signup') === '1';
  const [isOver18, setIsOver18] = useState(true);

  const handleContinue = () => {
    if (isOver18) {
      if (isSignUp) {
        navigate(`/register?role=${role}`);
      } else {
        navigate(`/login?role=${role}`);
      }
    } else {
      alert("You must be 18 or over to create an account.");
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
              <span className="font-bold">"You must be 18 years or over"</span>
            </p>

            <div className="age-options-container">
              {/* Option: Over 18 */}
              <div 
                className={`age-option ${isOver18 ? 'selected' : ''}`}
                onClick={() => setIsOver18(true)}
              >
                {isOver18 ? (
                  <CheckCircle2 className="text-green-500" size={24} />
                ) : (
                  <Circle className="text-gray-300" size={24} />
                )}
                <span>I am 18 or over</span>
              </div>

              {/* Option: Under 18 */}
              <div 
                className={`age-option ${!isOver18 ? 'selected' : ''}`}
                onClick={() => setIsOver18(false)}
              >
                {!isOver18 ? (
                  <CheckCircle2 className="text-green-500" size={24} />
                ) : (
                  <Circle className="text-gray-300" size={24} />
                )}
                <span>I am under 18</span>
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