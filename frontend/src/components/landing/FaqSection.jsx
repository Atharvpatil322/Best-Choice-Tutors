import React, { useState, useEffect } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import '../../styles/LandingPage.css';
import FAQ_ITEMS from '../../utils/faqData';
import { FAQSchema } from '../seo/index';
import { getActiveFaqs } from '@/services/faqService';

export default function FaqSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [faqItems, setFaqItems] = useState(FAQ_ITEMS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchFaqs = async () => {
      try {
        const data = await getActiveFaqs();
        if (!cancelled && data.faqs && data.faqs.length > 0) {
          setFaqItems(data.faqs);
        }
      } catch {
        // Fallback to static data if API fails
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchFaqs();
    return () => { cancelled = true; };
  }, []);

  const toggleFaq = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className="faq-section">
      {/* FAQ Schema is injected alongside the UI from the same data source */}
      <FAQSchema faqItems={faqItems} />
      <div className="faq-container">
        <h2 className="faq-main-title">Frequently Asked Questions</h2>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[#4FD1C5]" />
          </div>
        ) : (
          <div className="faq-list">
            {faqItems.map((faq, index) => {
              const isOpen = activeIndex === index;
              return (
                <div
                  key={faq._id || index}
                  className={`faq-item ${isOpen ? 'faq-open' : 'faq-closed'}`}
                >
                  <div className="faq-header" onClick={() => toggleFaq(index)}>
                    <h3 className="faq-question">{faq.question}</h3>
                    <div className="faq-icon-wrapper">
                      {isOpen ? <X size={24} /> : <Plus size={24} />}
                    </div>
                  </div>

                  {isOpen && (
                    <div className="faq-body">
                      <p className="faq-answer">{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
