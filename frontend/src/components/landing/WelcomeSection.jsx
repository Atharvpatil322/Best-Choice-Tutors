import React from 'react';
import { Search, Calendar, Landmark } from 'lucide-react';
import '../../styles/LandingPage.css';

export default function WelcomeSection() {
  return (
    <section className="welcome-section">
      <div className="welcome-container">
        <h2 className="welcome-title">Welcome to Best Choice Tutors</h2>
        
        {/* Flexbox container for even spacing */}
        <div className="welcome-flex-row">
          <div className="welcome-card">
            <div className="welcome-icon-wrapper">
              <Search size={40} strokeWidth={2.5} />
            </div>
            <h3 className="welcome-card-title">1. Search & Compare</h3>
            <p className="welcome-card-text">
              Browse verified tutors by subject, location, price, and availability. 
              Read reviews from real students.
            </p>
          </div>

          <div className="welcome-card">
            <div className="welcome-icon-wrapper">
              <Calendar size={40} strokeWidth={2.5} />
            </div>
            <h3 className="welcome-card-title">2. Book Securely</h3>
            <p className="welcome-card-text">
              Select your preferred time slot and pay securely. 
              Your payment is held safely until after the lesson.
            </p>
          </div>

          <div className="welcome-card">
            <div className="welcome-icon-wrapper">
              <Landmark size={40} strokeWidth={2.5} />
            </div>
            <h3 className="welcome-card-title">3. Learn & Grow</h3>
            <p className="welcome-card-text">
              Attend your lesson online or in-person, track your progress, 
              and leave a review to help others.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}