import React from 'react';
import '../../styles/LandingPage.css';
import reach from '../../images/reach.png'; 

export default function ReachSection() {
  return (
    <section className="reach-section">
      <div className="reach-container">
        <h2 className="reach-main-title">Global Reach, Local Expertise</h2>
        
        <div className="reach-flex-content">
          {/* LEFT COLUMN: IMAGE & BULLETS */}
          <div className="reach-left">
            <div className="reach-image-wrapper">
              <img src={reach} alt="Global Tutor Network" />
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
            <button className="btn-explore-location">
              Browse Tutors - Explore By Location
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}