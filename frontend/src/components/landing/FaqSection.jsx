import React, { useState, useEffect } from 'react';
import { Plus, X, Loader2, ExternalLink } from 'lucide-react';
import '../../styles/LandingPage.css';
import FAQ_ITEMS from '../../utils/faqData';
import { getActiveFaqs } from '@/services/faqService';

/**
 * Public FAQ accordion.
 *
 * General and subject FAQs are kept strictly apart. Without a `subject` this
 * shows the general set - the home page and the unfiltered tutor search. With a
 * `subject` it shows only that subject's own entries, and renders nothing at
 * all when it has none, so general answers never appear on a subject page.
 *
 * @param {string} [subject] - Canonical subject name, e.g. "English".
 */
export default function FaqSection({ subject }) {
  const [activeIndex, setActiveIndex] = useState(0);
  // Null until the first response, so an empty list can be told apart from
  // "not loaded yet" and the section can hide itself.
  const [faqItems, setFaqItems] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // Collapse any open answer when the subject changes: the panel at that
    // index belongs to the previous subject's list.
    setActiveIndex(0);
    setLoading(true);
    const fetchFaqs = async () => {
      try {
        const data = await getActiveFaqs(subject);
        // Whatever came back is what shows, empty included.
        if (!cancelled) setFaqItems(Array.isArray(data.faqs) ? data.faqs : []);
      } catch {
        // The API is unreachable. On the general pages the built-in list is a
        // better answer than a missing section; on a subject page there is no
        // safe stand-in, since the built-in list is general copy.
        if (!cancelled) setFaqItems(subject ? [] : FAQ_ITEMS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchFaqs();
    return () => { cancelled = true; };
  }, [subject]);

  const toggleFaq = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  // Nothing to say: drop the whole section rather than show an empty heading.
  if (!loading && (!faqItems || faqItems.length === 0)) return null;

  return (
    <section className="faq-section">
      {/* The FAQPage structured data for these questions is written into the
          page HTML at build time (backend/services/seoHtmlService.js), from
          the same FAQ records this section loads. */}
      <div className="faq-container">
        <h2 className="faq-main-title">Frequently Asked Questions</h2>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[#4FD1C5]" />
          </div>
        ) : (
          <div className="faq-list">
            {(faqItems || []).map((faq, index) => {
              const isOpen = activeIndex === index;
              const answerId = `faq-answer-${subject ? subject.replace(/\W+/g, '-') : 'general'}-${index}`;
              return (
                <div
                  key={faq._id || index}
                  className={`faq-item ${isOpen ? 'faq-open' : 'faq-closed'}`}
                >
                {/* Not a <button>: the header can hold a link, and a link
                    inside a button is invalid. Keyboard access is added by
                    hand instead. */}
                <div
                  className="faq-header"
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  onClick={() => toggleFaq(index)}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) return;
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      toggleFaq(index);
                    }
                  }}
                >
                    <div className="faq-question-wrapper">
                      <h3 className="faq-question">{faq.question}</h3>
                      {faq.link && (
                        <a
                          href={faq.link}
                          onClick={(e) => e.stopPropagation()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="faq-link-icon"
                          aria-label={`Learn more about: ${faq.question}`}
                          title="Learn more"
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}
                    </div>
                    <div className="faq-icon-wrapper">
                      {isOpen ? <X size={24} /> : <Plus size={24} />}
                    </div>
                  </div>

                  {/* Every answer stays in the page, hidden while closed. The
                      FAQ structured data describes all of them, and search
                      engines only credit answers that are actually on the page. */}
                  <div className="faq-body" id={answerId} hidden={!isOpen}>
                    <p className="faq-answer">{faq.answer}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
