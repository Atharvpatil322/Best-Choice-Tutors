import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Linkedin, Facebook, Instagram, ChevronDown } from 'lucide-react';
import '../../styles/LandingPage.css';
import { localImageUrl } from '@/utils/s3Assets';
import { DecodedImage } from '@/components/DecodedImage';
import { getActivePopularSearches } from '@/services/popularSearchService';
import { getActiveBenefits } from '@/services/benefitService';
import { getActiveFaqs } from '@/services/faqService';
import { getPublishedBlogs } from '@/services/blogService';
import { subjectFromName, tutorSearchPath } from '@/constants/subjects';
import { useSubjectSlugs } from '@/hooks/useSubjectSlugs';
import { sharedRequest } from '@/utils/sharedRequest';

const logoImage = localImageUrl('images/BCT_Logo.png');

/** Fixed links shown in the Quick Links section. */
const QUICK_LINKS = [
  { to: '/onboarding', label: 'Book a Tutor' },
  { to: '/tutors', label: 'Find a Tutor' },
  { to: '/register?role=tutor', label: 'Become a Tutor' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/about', label: 'About Us' },
  { to: '/blog', label: 'Blog' },
  { to: '/contact', label: 'Contact' },
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms and Conditions' },
];

/** Blog posts listed in the footer. */
const FOOTER_POST_COUNT = 5;
/**
 * Same page and size as the first page of /blog. The blog service keeps the
 * answer, so opening the blog from the footer shows the list straight away.
 */
const BLOG_LIST_PARAMS = { page: 1, limit: 12 };

/**
 * One collapsible footer section.
 *
 * Built on <details>, so it opens with the keyboard and screen readers out of
 * the box, and its links and text stay in the page while it is closed -
 * search engines still see them.
 */
function FooterAccordion({ title, children }) {
  return (
    <details className="footer-accordion">
      <summary className="footer-accordion-summary">
        <span>{title}</span>
        <ChevronDown size={18} className="footer-accordion-chevron" aria-hidden />
      </summary>
      <div className="footer-accordion-body">{children}</div>
    </details>
  );
}

/**
 * Load a list for the footer. Failures leave the section empty, and the
 * footer simply leaves that section out.
 */
function useFooterList(load, pick) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    let cancelled = false;
    load()
      .then((data) => {
        if (!cancelled) setItems(pick(data) || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // load and pick are module-level functions passed by the footer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return items;
}

const loadBenefits = () => getActiveBenefits();
const pickBenefits = (data) => data.benefits;
const loadFaqs = () => getActiveFaqs();
const pickFaqs = (data) => data.faqs;
const loadPopularSearches = () => getActivePopularSearches();
const pickPopularSearches = (data) => data.popularSearches;
const loadPosts = () => sharedRequest('footer-posts', () => getPublishedBlogs(BLOG_LIST_PARAMS));
const pickPosts = (data) => (data.blogs || []).slice(0, FOOTER_POST_COUNT);

export default function FooterSection() {
  const currentYear = new Date().getFullYear();
  // Re-render when subject page URLs load, so popular searches link to them.
  useSubjectSlugs();

  const benefits = useFooterList(loadBenefits, pickBenefits);
  const faqs = useFooterList(loadFaqs, pickFaqs);
  const popularSearches = useFooterList(loadPopularSearches, pickPopularSearches);
  const posts = useFooterList(loadPosts, pickPosts);

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
              Transform your educational journey with quality tutoring.
            </p>
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

        <div className="footer-accordions">
          <FooterAccordion title="Quick Links">
            <nav aria-label="Quick links">
              <ul className="footer-accordion-links">
                {QUICK_LINKS.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          </FooterAccordion>

          {benefits.length > 0 && (
            <FooterAccordion title="Why Choose Us">
              <ul className="footer-accordion-points">
                {benefits.map((benefit) => (
                  <li key={benefit._id || benefit.title}>
                    <strong>{benefit.title}</strong>
                    <span>{benefit.description}</span>
                  </li>
                ))}
              </ul>
            </FooterAccordion>
          )}

          {faqs.length > 0 && (
            <FooterAccordion title="FAQ">
              <dl className="footer-accordion-faqs">
                {faqs.map((faq) => (
                  <div key={faq._id || faq.question}>
                    <dt>{faq.question}</dt>
                    <dd>{faq.answer}</dd>
                  </div>
                ))}
              </dl>
            </FooterAccordion>
          )}

          {popularSearches.length > 0 && (
            <FooterAccordion title="Popular Searches">
              <nav aria-label="Popular tutor searches">
                <ul className="footer-accordion-links">
                  {popularSearches.map((item) => (
                    <li key={item._id || item.query}>
                      {/* A search naming a subject opens that subject's page;
                          anything else opens the full tutor list. */}
                      <Link to={tutorSearchPath(subjectFromName(item.query))}>{item.label}</Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </FooterAccordion>
          )}

          {posts.length > 0 && (
            <FooterAccordion title="Blog">
              <nav aria-label="Latest articles">
                <ul className="footer-accordion-links footer-accordion-links--wide">
                  {posts.map((post) => (
                    <li key={post.slug}>
                      <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                    </li>
                  ))}
                  <li>
                    <Link to="/blog" className="footer-accordion-more">
                      All articles
                    </Link>
                  </li>
                </ul>
              </nav>
            </FooterAccordion>
          )}
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
