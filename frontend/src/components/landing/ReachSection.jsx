import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/LandingPage.css';
import { localImageUrl } from '@/utils/s3Assets';
import { DecodedImage } from '@/components/DecodedImage';
const reach = localImageUrl('images/reach.png');

export default function ReachSection() {
  const navigate = useNavigate();

  const goToSignUpForLocation = () => {
    navigate('/register?role=learner&from=explore-location');
  };

  return (
    <section className="reach-section">
      <div className="reach-container">
        <h2 className="reach-main-title">Global Reach, Local Expertise</h2>
        
        <div className="reach-flex-content">
          {/* LEFT COLUMN: IMAGE & BULLETS */}
          <div className="reach-left">
            <div className="reach-image-wrapper">
              <DecodedImage src={reach} alt="Global Tutor Network" />
            </div>
            {/* Horizontal Bullets */}
            <div className="reach-bullets">
              <span className="bullet-item">• Connect Globally</span>
              <span className="bullet-item">• Learn Anytime</span>
              <span className="bullet-item">• Achieve More</span>
            </div>
          </div>

          {/* RIGHT COLUMN: TEXT CONTENT */}
          <div className="reach-right">
            <h3 className="reach-sub-title">Find Trusted Tutors Worldwide</h3>
            <p className="reach-description">
              Best Choice Tutors is proud to serve students and connect them with 
              qualified educators across various countries. Our global network 
              ensures that quality education is accessible no matter where you are.
            </p>
            <button
              type="button"
              className="btn-explore-location"
              onClick={goToSignUpForLocation}
            >
              Browse Tutors - Explore By Location
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

