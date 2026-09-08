import React from 'react';
import { Search, Calendar, Landmark } from 'lucide-react';
import '../../styles/LandingPage.css';
import { usePageContent, contentOr, itemsOr } from '@/hooks/usePageContent';

/** Icons stay in the component, matched to cards by position. */
const CARD_ICONS = [Search, Calendar, Landmark];

/** The cards as they appear today, used until an admin edits them. */
const DEFAULT_CARDS = [
  {
    title: '1. Search & Compare',
    description:
      'Browse verified tutors by subject, location, price, and availability. Read reviews from real students.',
  },
  {
    title: '2. Book Securely',
    description:
      'Select your preferred time slot and pay securely. Your payment is held safely until after the lesson.',
  },
  {
    title: '3. Learn & Grow',
    description:
      'Attend your lesson online or in-person, track your progress, and leave a review to help others.',
  },
];

export default function WelcomeSection() {
  const sections = usePageContent('home');
  const heading = contentOr(sections.welcome, 'heading', 'Get Started in 3 Simple Steps');
  const cards = itemsOr(sections.welcome, DEFAULT_CARDS);
  return (
    <section className="welcome-section">
      <div className="welcome-container">
        <h2 className="welcome-title">{heading}</h2>
        
        {/* Flexbox container for even spacing */}
        <div className="welcome-flex-row">
          {cards.map((card, index) => {
            const Icon = CARD_ICONS[index % CARD_ICONS.length];
            return (
              <div className="welcome-card" key={card.title || index}>
                <div className="welcome-icon-wrapper">
                  <Icon size={40} strokeWidth={2.5} />
                </div>
                <h3 className="welcome-card-title">{card.title}</h3>
                <p className="welcome-card-text">{card.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}