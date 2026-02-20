/**
 * How it works – Step-by-step flow for learners and tutors (no admin).
 * Anchored by #how-it-works for header link.
 * Smooth entrance when section comes into view.
 */

import { useState, useEffect, useRef } from 'react';
import {
  UserPlus,
  Search,
  CalendarCheck,
  CreditCard,
  Video,
  Star,
  BookOpen,
  Settings,
  ShieldCheck,
  Bell,
  Banknote,
  GraduationCap,
  Briefcase,
} from 'lucide-react';
import '../../styles/LandingPage.css';

const LEARNER_STEPS = [
  {
    step: 1,
    icon: UserPlus,
    title: 'Sign up',
    description: 'Create a free account as a learner or parent. Choose your role and add basic details.',
  },
  {
    step: 2,
    icon: Search,
    title: 'Browse tutors',
    description: 'Search by subject, location, price and mode. View profiles, reviews and availability.',
  },
  {
    step: 3,
    icon: CalendarCheck,
    title: 'Book a session',
    description: 'Pick a time slot that works for you. Confirm booking and complete any age-eligibility steps.',
  },
  {
    step: 4,
    icon: CreditCard,
    title: 'Pay securely',
    description: 'Payment is held safely in escrow and only released to the tutor after your lesson.',
  },
  {
    step: 5,
    icon: Video,
    title: 'Attend your lesson',
    description: 'Meet online or in-person. Use in-app chat to coordinate and ask questions.',
  },
  {
    step: 6,
    icon: Star,
    title: 'Review & rebook',
    description: 'Leave a review to help others. Book the same tutor again or try someone new.',
  },
];

const TUTOR_STEPS = [
  {
    step: 1,
    icon: GraduationCap,
    title: 'Sign up as a tutor',
    description: 'Create an account and choose “Become a tutor” to start your teaching journey.',
  },
  {
    step: 2,
    icon: BookOpen,
    title: 'Create your profile',
    description: 'Add subjects, qualifications, hourly rate, teaching mode (online/in-person) and a short bio.',
  },
  {
    step: 3,
    icon: Settings,
    title: 'Set your availability',
    description: 'Define your weekly schedule and timezone. Add exceptions for holidays or time off.',
  },
  {
    step: 4,
    icon: ShieldCheck,
    title: 'Get verified',
    description: 'Submit qualification documents and, for in-person tutoring, DBS check. We verify and approve.',
  },
  {
    step: 5,
    icon: Bell,
    title: 'Receive bookings',
    description: 'Learners find you and book sessions. You get notified and can manage bookings in your dashboard.',
  },
  {
    step: 6,
    icon: Banknote,
    title: 'Deliver sessions & get paid',
    description: 'Teach the lesson, then payment is released to you. Track earnings and payouts in your wallet.',
  },
];

function StepCard({ step, Icon, title, description }) {
  return (
    <div className="how-step-card">
      <div className="how-step-number" aria-hidden="true">
        {step}
      </div>
      <div className="how-step-icon-wrap">
        <Icon size={28} strokeWidth={2} aria-hidden="true" />
      </div>
      <h4 className="how-step-title">{title}</h4>
      <p className="how-step-desc">{description}</p>
    </div>
  );
}

export default function HowItWorksSection() {
  const [activePath, setActivePath] = useState('learner');
  const sectionRef = useRef(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="how-section"
      aria-labelledby="how-it-works-heading"
    >
      <div className="how-container">
        <h2 id="how-it-works-heading" className="how-heading">
          How it works
        </h2>
        <p className="how-subheading">
          From sign-up to session — see how learners and tutors use Best Choice Tutors.
        </p>

        <div className="how-tabs" role="tablist" aria-label="Choose your path">
          <button
            type="button"
            role="tab"
            id="tab-learner"
            aria-selected={activePath === 'learner'}
            aria-controls="panel-learner"
            className={`how-tab ${activePath === 'learner' ? 'how-tab-active' : ''}`}
            onClick={() => setActivePath('learner')}
          >
            <span className="how-tab-icon" aria-hidden="true">
              <GraduationCap size={20} />
            </span>
            For learners
          </button>
          <button
            type="button"
            role="tab"
            id="tab-tutor"
            aria-selected={activePath === 'tutor'}
            aria-controls="panel-tutor"
            className={`how-tab ${activePath === 'tutor' ? 'how-tab-active' : ''}`}
            onClick={() => setActivePath('tutor')}
          >
            <span className="how-tab-icon" aria-hidden="true">
              <Briefcase size={20} />
            </span>
            For tutors
          </button>
        </div>

        <div
          id="panel-learner"
          role="tabpanel"
          aria-labelledby="tab-learner"
          hidden={activePath !== 'learner'}
          className="how-panel"
        >
          <div className="how-steps-grid">
            {LEARNER_STEPS.map(({ step, icon: Icon, title, description }) => (
              <StepCard
                key={step}
                step={step}
                Icon={Icon}
                title={title}
                description={description}
              />
            ))}
          </div>
        </div>

        <div
          id="panel-tutor"
          role="tabpanel"
          aria-labelledby="tab-tutor"
          hidden={activePath !== 'tutor'}
          className="how-panel"
        >
          <div className="how-steps-grid">
            {TUTOR_STEPS.map(({ step, icon: Icon, title, description }) => (
              <StepCard
                key={step}
                step={step}
                Icon={Icon}
                title={title}
                description={description}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
