import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import '../../styles/LandingPage.css';

export default function FaqSection() {
  const [activeIndex, setActiveIndex] = useState(0); 

  const faqs = [
    {
      question: "How do I book a tutor?",
      answer: "You can use our search bar on the homepage to filter tutors by subject, level, price, location, and gender. Browse profiles and contact tutors directly."
    },
    {
      question: "What is your tutor vetting process?",
      answer: "Every tutor undergoes a rigorous verification process, including identity checks, academic qualification verification, and enhanced DBS checks (for UK tutors) to ensure safety and quality."
    },
    {
      question: "Can I choose between online and in-person tutoring?",
      answer: "Yes! You can filter your search based on your preference. Many of our tutors offer both flexible online sessions via our integrated classroom and traditional in-person lessons."
    },
    {
      question: "What if I'm not satisfied with my tutor?",
      answer: "Your satisfaction is our priority. If the first lesson doesn't meet your expectations, contact our support team. We'll help you find a better match or process a refund based on our satisfaction guarantee."
    }
  ];

  const toggleFaq = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className="faq-section">
      <div className="faq-container">
        <h2 className="faq-main-title">Frequently Asked Questions</h2>
        
        <div className="faq-list">
          {faqs.map((faq, index) => {
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