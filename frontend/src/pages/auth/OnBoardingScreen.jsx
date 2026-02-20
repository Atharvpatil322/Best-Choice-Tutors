import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import '../../styles/OnBoarding.css';
import man from '../../images/man.png';
import woman from '../../images/woman.png';

function OnBoardingScreen() {
  const navigate = useNavigate();

  return (
    <div className="onboarding-page">
      {/* Curved Navy Background Section */}
      <div className="onboarding-header">
        <h1 className="onboarding-main-title">
          Smart tutoring <br /> for brighter futures.
        </h1>
      </div>

      <div className="onboarding-container">
        <div className="onboarding-cards-wrapper">
          
          {/* I'm a Student Card */}
          <Card className="onboarding-card">
            <CardContent className="p-0 flex flex-col items-center">
              <div className="card-image-box">
                <img src={woman} alt="Student illustration" />
              </div>
              
              <Button 
                className="btn-onboard btn-student"
                onClick={() => navigate('/age-consent?role=learner')}
              >
                Log in as a Student
              </Button>
              <button
                type="button"
                className="onboarding-signup-link"
                onClick={() => navigate('/age-consent?role=learner&signup=1')}
              >
                Sign up as a Student
              </button>

              <div className="card-info">
                <h3>I'm a Student</h3>
                <p>Find your perfect tutor and <br /> book lessons.</p>
              </div>
            </CardContent>
          </Card>

          {/* I'm a Tutor Card */}
          <Card className="onboarding-card">
            <CardContent className="p-0 flex flex-col items-center">
              <div className="card-image-box">
                <img src={man} alt="Tutor illustration" />
              </div>
              
              <Button 
                className="btn-onboard btn-tutor"
                onClick={() => navigate('/age-consent?role=tutor')}
              >
                Log in as a Tutor
              </Button>
              <button
                type="button"
                className="onboarding-signup-link"
                onClick={() => navigate('/age-consent?role=tutor&signup=1')}
              >
                Sign up as a Tutor
              </button>

              <div className="card-info">
                <h3>I'm a Tutor</h3>
                <p>Share your knowledge and <br /> earn money.</p>
              </div>
            </CardContent>
          </Card>

        </div>

        <div className="onboarding-footer">
          <p>
            Need help? Contact us at {' '}
            <a href="mailto:support@bestchoicetutor.com" className="font-bold">
              support@bestchoicetutors.com
            </a>
          </p>
          <Link to="/register" className="signup-link">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OnBoardingScreen;