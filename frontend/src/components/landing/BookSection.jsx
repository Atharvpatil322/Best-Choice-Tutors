import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/LandingPage.css';

export default function BookSection() {
  const navigate = useNavigate();

  return (
    <section className="cta-section">
      <div className="cta-container">
        <div className="cta-card">
          <h2 className="cta-title">
            Ready to Start Your Journey with <br /> Best Choice Tutors?
          </h2>
          <p className="cta-description">
            Whether you're looking for expert academic support or want to inspire the next <br /> 
            generation, we're here to help.
          </p>
          
          <div className="cta-button-group">
            <button 
              className="btn-cta-primary" 
              onClick={() => navigate('/dashboard/browse-tutors')}
            >
              Book a Tutor
            </button>
            <button 
              className="btn-cta-secondary" 
              onClick={() => navigate('/register?role=tutor')}
            >
              Become a Tutor
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}