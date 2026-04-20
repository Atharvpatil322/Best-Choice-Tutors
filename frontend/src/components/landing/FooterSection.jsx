import React from 'react';
import { Link } from 'react-router-dom';
import { Linkedin, Facebook, Instagram } from 'lucide-react';
import '../../styles/LandingPage.css';
import { localImageUrl } from '@/utils/s3Assets';
import { DecodedImage } from '@/components/DecodedImage';

const logoImage = localImageUrl('images/BCT_Logo.png');

export default function FooterSection() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-section">
      <div className="footer-container">
        <div className="footer-top">
          {/* Brand Column */}
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <DecodedImage src={logoImage} alt="Best Choice Tutors Logo" />
            </Link>
            <p className="footer-about">
              Connecting students with expert tutors for personalised learning experiences. 
              Transform your education journey with quality tutoring.
            </p>
          </div>

          {/* Links Columns */}
          <div className="footer-links-grid">
            <div className="link-column">
              <Link to="/onboarding">Book a Tutor</Link>
              <Link to="/register?role=tutor">Become a Tutor</Link>
            </div>
            <div className="link-column">
              <Link to="/about">About Us</Link>
              <Link to="/contact">Contact</Link>
            </div>
            <div className="link-column">
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms and Conditions</Link>
            </div>
          </div>

          {/* Social Icons */}
          <div className="footer-socials">
            <a
              href="https://www.facebook.com/share/1FNTqVLKEd/?mibextid=wwXIfr"
              className="social-icon facebook"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Best Choice Tutors on Facebook"
            >
              <Facebook size={20} />
            </a>
            <a
              href="https://www.linkedin.com/in/best-choice-tutors-119a203b9?utm_source=share_via&utm_content=profile&utm_medium=member_ios"
              className="social-icon linkedin"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Best Choice Tutors on LinkedIn"
            >
              <Linkedin size={20} />
            </a>
            <a
              href="https://www.instagram.com/best.choice.tutors?igsh=MWpxa3lobmZ5YW1vYQ%3D%3D&utm_source=qr"
              className="social-icon instagram"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Best Choice Tutors on Instagram"
            >
              <Instagram size={20} />
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p>© {currentYear} BestChoiceTutors. All rights reserved.</p>
          <p className="footer-badges">Secure Platform • Verified Tutors</p>
        </div>
      </div>
    </footer>
  );
}

