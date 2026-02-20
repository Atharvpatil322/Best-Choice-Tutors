import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Search, Menu, X, ChevronDown } from "lucide-react";
import '../../styles/LandingPage.css';
import logoImage from '../../images/BCT_Logo.png';

const SUBJECTS_LIST = [
  'Mathematics', 'English', 'Science', 'Physics', 'Chemistry', 'Biology',
  'History', 'Geography', 'French', 'Spanish', 'German', 'Computer Science',
  'Economics', 'Business Studies', 'Psychology', 'Art', 'Music', 'Drama',
  'Physical Education', 'Other',
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [subjectsOpen, setSubjectsOpen] = useState(false);
  const hideSubjectsTimerRef = useRef(null);

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
          <img src={logoImage} alt="BCT Logo" className="logo-img" />
        </Link>

        <nav className="header-nav" aria-label="Main navigation">
          <Link to="/">Home</Link>
          <div
            className="header-nav-item-with-dropdown"
            onMouseEnter={showSubjectsDropdown}
            onMouseLeave={scheduleHideSubjectsDropdown}
          >
            <Link to="/subjects" className="header-nav-link header-nav-link-subjects">
              Subjects
              <ChevronDown size={14} className="header-subjects-chevron" aria-hidden />
            </Link>
            <div
              className="header-subjects-dropdown"
              role="menu"
              aria-label="Subjects list"
              onMouseEnter={showSubjectsDropdown}
              onMouseLeave={scheduleHideSubjectsDropdown}
            >
              <div className="header-subjects-dropdown-inner">
                <div className="header-subjects-grid">
                  {SUBJECTS_LIST.map((subject) => (
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
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
          {/* <Link to="/pricing">Pricing</Link> */}
        </nav>

        <div className="header-actions">
          <Link to="/onboarding" className="btn-book">
            <Search size={16} strokeWidth={3} />
            Book a Tutor
          </Link>
          <Link to="/register?role=tutor" className="btn-become-tutor">
            Become a Tutor
          </Link>
          <Link to="/login" className="login-link">Sign Up / Sign In</Link>
        </div>

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

      <div className={`header-mobile-menu ${menuOpen ? 'is-open' : ''}`} aria-hidden={!menuOpen}>
        <nav className="header-nav" aria-label="Mobile navigation">
          <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
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
                {SUBJECTS_LIST.map((subject) => (
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
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
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
