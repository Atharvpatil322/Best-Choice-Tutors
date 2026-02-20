import React from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Linkedin, Facebook, Instagram } from 'lucide-react';
import '../../styles/LandingPage.css';
import logoImage from '../../images/BCT_Logo.png';

export default function FooterSection() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-section">
      <div className="footer-container">
        <div className="footer-top">
          {/* Brand Column */}
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <img src={logoImage} alt="Best Choice Tutors Logo" />
            </Link>
            <p className="footer-about">
              Connecting students with expert tutors for personalized learning experiences. 
              Transform your education journey with quality tutoring.
            </p>
          </div>

          {/* Links Columns */}
          <div className="footer-links-grid">
            <div className="link-column">
              <Link to="/dashboard/browse-tutors">Book a Tutor</Link>
              <Link to="/register?role=tutor">Become a Tutor</Link>
              <Link to="/dashboard">Student Dashboard</Link>
              <Link to="/locations">Popular Locations</Link>
            </div>
            <div className="link-column">
              <Link to="/about">About Us</Link>
              <Link to="/stories">Success Stories</Link>
              <Link to="/safety">Safety & Trust</Link>
              <Link to="/contact">Contact</Link>
            </div>
            <div className="link-column">
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Success Stories</Link>
              <Link to="/cookies">Cookie Policy</Link>
              <Link to="/refunds">Refund Policy</Link>
            </div>
          </div>

          {/* Social Icons */}
          <div className="footer-socials">
            <a href="https://twitter.com" className="social-icon twitter"><Twitter size={20} /></a>
            <a href="https://linkedin.com" className="social-icon linkedin"><Linkedin size={20} /></a>
            <a href="https://facebook.com" className="social-icon facebook"><Facebook size={20} /></a>
            <a href="https://instagram.com" className="social-icon instagram"><Instagram size={20} /></a>
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