import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/LandingPage.css';
import { localImageUrl } from '@/utils/s3Assets';
import { DecodedImage } from '@/components/DecodedImage';
import { usePageContent, contentOr, itemsOr } from '@/hooks/usePageContent';
const reach = localImageUrl('images/reach.png');

/** Bullets as they appear today, used until an admin edits them. */
const DEFAULT_BULLETS = [
  { title: '• Connect Globally' },
  { title: '• Learn Anytime' },
  { title: '• Achieve More' },
];

const DEFAULT_BODY =
  'Best Choice Tutors is proud to serve students and connect them with qualified educators across various countries. Our global network ensures that quality education is accessible no matter where you are.';

export default function ReachSection() {
  const sections = usePageContent('home');
  const reach = sections.reach;
  const heading = contentOr(reach, 'heading', 'Global Reach, Local Expertise');
  const subheading = contentOr(reach, 'subheading', 'Find Trusted Tutors Worldwide');
  const body = contentOr(reach, 'body', DEFAULT_BODY);
  const ctaLabel = contentOr(reach, 'ctaLabel', 'Browse Tutors - Explore By Location');
  const ctaHref = contentOr(reach, 'ctaHref', '/register?role=learner&from=explore-location');
  const bullets = itemsOr(reach, DEFAULT_BULLETS);
  const navigate = useNavigate();

  const goToSignUpForLocation = () => {
    navigate(ctaHref);
  };

  return (
    <section className="reach-section">
      <div className="reach-container">
        <h2 className="reach-main-title">{heading}</h2>
        
        <div className="reach-flex-content">
          {/* LEFT COLUMN: IMAGE & BULLETS */}
          <div className="reach-left">
            <div className="reach-image-wrapper">
              <DecodedImage src={reach} alt="Global Tutor Network" />
            </div>
            {/* Horizontal Bullets */}
            <div className="reach-bullets">
              {bullets.map((bullet, index) => (
                <span className="bullet-item" key={bullet.title || index}>
                  {bullet.title}
                </span>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN: TEXT CONTENT */}
          <div className="reach-right">
            <h3 className="reach-sub-title">{subheading}</h3>
            <p className="reach-description">{body}</p>
            <button
              type="button"
              className="btn-explore-location"
              onClick={goToSignUpForLocation}
            >
              {ctaLabel}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

