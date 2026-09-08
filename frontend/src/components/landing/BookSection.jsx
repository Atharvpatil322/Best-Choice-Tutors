import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/LandingPage.css';
import { usePageContent, contentOr, itemsOr } from '@/hooks/usePageContent';

/** The two buttons as they appear today, used until an admin edits them. */
const DEFAULT_BUTTONS = [
  { title: 'Book a Tutor', linkUrl: '/onboarding' },
  { title: 'Become a Tutor', linkUrl: '/register?role=tutor' },
];

/** The first button is the primary style, any others are secondary. */
const BUTTON_CLASSES = ['btn-cta-primary', 'btn-cta-secondary'];

export default function BookSection() {
  const navigate = useNavigate();
  const sections = usePageContent('home');
  const heading = contentOr(sections.book, 'heading', 'Start your journey with Best Choice Tutors');
  const description = contentOr(
    sections.book,
    'subheading',
    "Whether you're looking for expert academic support or want to inspire the next generation, we're here to help.",
  );
  const buttons = itemsOr(sections.book, DEFAULT_BUTTONS);

  return (
    <section className="cta-section">
      <div className="cta-container">
        <div className="cta-card">
          <h2 className="cta-title">
            {heading}
          </h2>
          <p className="cta-description">
            {description}
          </p>
          
          <div className="cta-button-group">
            {buttons.map((button, index) => (
              <button
                key={button.title || index}
                className={BUTTON_CLASSES[index] || 'btn-cta-secondary'}
                onClick={() => navigate(button.linkUrl || '/onboarding')}
              >
                {button.title}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}