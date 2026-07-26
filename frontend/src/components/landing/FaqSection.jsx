import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import '../../styles/LandingPage.css';
import FAQ_ITEMS from '../../utils/faqData';
import { FAQSchema } from '../seo/index';

export default function FaqSection() {
  const [activeIndex, setActiveIndex] = useState(0); 

  const toggleFaq = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className="faq-section">
      {/* FAQ Schema is injected alongside the UI from the same data source */}
      <FAQSchema faqItems={FAQ_ITEMS} />
      <div className="faq-container">
        <h2 className="faq-main-title">Frequently Asked Questions</h2>
        
        <div className="faq-list">
          {FAQ_ITEMS.map((faq, index) => {
            const isOpen = activeIndex === index;
            return (
              <div 
                key={index} 
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
      </div>
    </section>
  );
}
