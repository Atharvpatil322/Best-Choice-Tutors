import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Menu, X, ChevronDown, PartyPopper } from "lucide-react";
import '../../styles/LandingPage.css';
import { localImageUrl } from '@/utils/s3Assets';
import { DecodedImage } from '@/components/DecodedImage';
import { CANONICAL_SUBJECTS } from '@/constants/subjects';
import { isAuthenticated } from '@/lib/auth';

const logoImage = localImageUrl('images/BCT_Logo.png');

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [subjectsOpen, setSubjectsOpen] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const hideSubjectsTimerRef = useRef(null);
  const guest = !isAuthenticated();

  useEffect(() => {
    if (!promoOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setPromoOpen(false);
    };
    const onPointerDown = (e) => {
      if (e.target.closest(".header-promo-trigger, .header-promo-card")) return;
      setPromoOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [promoOpen]);

  const showSubjectsDropdown = () => {
    if (hideSubjectsTimerRef.current) {
      clearTimeout(hideSubjectsTimerRef.current);
      hideSubjectsTimerRef.current = null;
    }
    document.querySelector('.header-subjects-dropdown')?.classList.add('is-visible');
  };

  const scheduleHideSubjectsDropdown = () => {
    hideSubjectsTimerRef.current = setTimeout(() => {
      document.querySelector('.header-subjects-dropdown')?.classList.remove('is-visible');
      hideSubjectsTimerRef.current = null;
    }, 150);
  };

  return (
    <header className="main-header">
      <div className="header-container">
        <Link to="/" className="header-logo" onClick={() => setMenuOpen(false)}>
          <DecodedImage
            src={logoImage}
            alt="BCT Logo"
            className="logo-img"
            loading="eager"
            fetchpriority="high"
          />
        </Link>

        <nav className="header-nav" aria-label="Main navigation">
          <Link to="/">Home</Link>
          <Link to="/about" onClick={() => setMenuOpen(false)}>About Us</Link>
          <Link to="/how-it-works" onClick={() => setMenuOpen(false)}>How it works</Link>
          <div
            className="header-nav-item-with-dropdown"
            onMouseEnter={showSubjectsDropdown}
            onMouseLeave={scheduleHideSubjectsDropdown}
          >
            <span className="header-nav-link header-nav-link-subjects">
              Subjects
              <ChevronDown size={14} className="header-subjects-chevron" aria-hidden />
            </span>
            <div
              className="header-subjects-dropdown"
              role="menu"
              aria-label="Subjects list"
              onMouseEnter={showSubjectsDropdown}
              onMouseLeave={scheduleHideSubjectsDropdown}
            >
              <div className="header-subjects-dropdown-inner">
                <div className="header-subjects-grid">
                  {CANONICAL_SUBJECTS.map((subject) => (
                    <Link
                      key={subject}
                      to={`/?subject=${encodeURIComponent(subject)}`}
                      className="header-subject-box"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      {subject}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* <Link to="/pricing">Pricing</Link> */}
        </nav>

        <div className="header-actions">
          {guest && (
            <button
              type="button"
              className="header-promo-trigger header-promo-trigger--desktop"
              aria-label="Limited offer: first session discount"
              aria-expanded={promoOpen}
              aria-controls="header-first-session-promo"
              onClick={() => setPromoOpen((o) => !o)}
            >
              <PartyPopper size={22} strokeWidth={2} aria-hidden />
            </button>
          )}
          <Link to="/onboarding" className="btn-book">
            <Search size={16} strokeWidth={3} />
            Book a Tutor
          </Link>
          <Link to="/register?role=tutor" className="btn-become-tutor">
            Become a Tutor
          </Link>
          <Link to="/login" className="login-link">Sign Up / Sign In</Link>
        </div>

        <div className="header-end-cluster">
          {guest && (
            <button
              type="button"
              className="header-promo-trigger header-promo-trigger--mobile"
              aria-label="Limited offer: first session discount"
              aria-expanded={promoOpen}
              aria-controls="header-first-session-promo"
              onClick={() => setPromoOpen((o) => !o)}
            >
              <PartyPopper size={22} strokeWidth={2} aria-hidden />
            </button>
          )}
          <button
            type="button"
            className="header-nav-toggle"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {guest && promoOpen && (
        <div
          id="header-first-session-promo"
          className="header-promo-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="header-promo-title"
        >
          <div className="header-promo-card-inner">
            <div className="header-promo-icon-wrap" aria-hidden>
              <PartyPopper size={28} strokeWidth={2} />
            </div>
            <h2 id="header-promo-title" className="header-promo-title">
              First session: 20% off
            </h2>
            <p className="header-promo-text">
              New learners get 20% off their first tutoring session. Sign up and book to apply the discount.
            </p>
            <Link
              to="/onboarding"
              className="header-promo-cta"
              onClick={() => setPromoOpen(false)}
            >
              Book a tutor
            </Link>
          </div>
        </div>
      )}

      <div className={`header-mobile-menu ${menuOpen ? 'is-open' : ''}`} aria-hidden={!menuOpen}>
        <nav className="header-nav" aria-label="Mobile navigation">
          <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/about" onClick={() => setMenuOpen(false)}>About Us</Link>
          <Link to="/how-it-works" onClick={() => setMenuOpen(false)}>How it works</Link>
          <div className="header-mobile-subjects-wrap">
            <button
              type="button"
              className="header-mobile-subjects-trigger"
              onClick={() => setSubjectsOpen((o) => !o)}
              aria-expanded={subjectsOpen}
              aria-controls="header-mobile-subjects-panel"
            >
              Subjects
              <ChevronDown size={16} className={subjectsOpen ? 'rotate-180' : ''} aria-hidden />
            </button>
            <div
              id="header-mobile-subjects-panel"
              className={`header-mobile-subjects-panel ${subjectsOpen ? 'is-open' : ''}`}
              aria-hidden={!subjectsOpen}
            >
              <div className="header-subjects-grid header-subjects-grid-mobile">
                {CANONICAL_SUBJECTS.map((subject) => (
                  <Link
                    key={subject}
                    to={`/?subject=${encodeURIComponent(subject)}`}
                    className="header-subject-box"
                    onClick={() => { setMenuOpen(false); setSubjectsOpen(false); }}
                  >
                    {subject}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          {/* <Link to="/pricing" onClick={() => setMenuOpen(false)}>Pricing</Link> */}
        </nav>
        <div className="header-actions">
          <Link to="/onboarding" className="btn-book" onClick={() => setMenuOpen(false)}>
            <Search size={16} strokeWidth={3} />
            Book a Tutor
          </Link>
          <Link to="/register?role=tutor" className="btn-become-tutor" onClick={() => setMenuOpen(false)}>
            Become a Tutor
          </Link>
          <Link to="/login" className="login-link" onClick={() => setMenuOpen(false)}>Sign Up / Sign In</Link>
        </div>
      </div>
    </header>
  );
}

