import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';
import '../../styles/LandingPage.css';
import { DecodedImage } from '@/components/DecodedImage';

/** Two cards side-by-side from this width up; one card below (matches CSS breakpoints). */
const WIDE_TWO_CARDS_QUERY = '(min-width: 768px)';

export default function ReviewSection() {
  const [showTwoCards, setShowTwoCards] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(WIDE_TWO_CARDS_QUERY).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(WIDE_TWO_CARDS_QUERY);
    const sync = () => setShowTwoCards(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const reviews = [
    {
      id: 1,
      name: "Sarah J.",
      role: "Parent of GCSE Student",
      image: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150",
      text: "Best Choice Tutors transformed my son's grades! His confidence has soared, and he actually enjoys math now. The matching process was spot-on.",
      rating: 5,
      type: 'dark'
    },
    {
      id: 2,
      name: "David R.",
      role: "Parent",
      image: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150",
      text: "Finding a reliable tutor for Chemistry used to be a nightmare. Best Choice Tutors made it so easy. Our tutor was fantastic and genuinely cared.",
      rating: 5,
      type: 'light'
    },
    {
      id: 3,
      name: "Emma L.",
      role: "A-Level Student",
      image: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150",
      text: "The online platform is so smooth. My Biology tutor helps me break down complex topics into easy steps. Highly recommend for A-Level prep!",
      rating: 5,
      type: 'dark'
    },
    {
      id: 4,
      name: "Michael T.",
      role: "Parent",
      image: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150",
      text: "Professional, punctual, and very knowledgeable. The verification process gave me peace of mind knowing my daughter was in good hands.",
      rating: 5,
      type: 'light'
    },
    {
      id: 5,
      name: "Jessica W.",
      role: "University Student",
      image: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150",
      text: "Helped me enormously with my University level Statistics. I went from failing mocks to an A in my finals. Thank you so much!",
      rating: 5,
      type: 'dark'
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1 === reviews.length ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? reviews.length - 1 : prev - 1));
  };

  return (
    <section className="review-section">
      <div className="review-container">
        <h2 className="review-main-title">What Our Students & Parents Say</h2>

        <div className="review-carousel-wrapper">
          <button
            type="button"
            className="carousel-btn prev"
            onClick={prevSlide}
            aria-label="Previous testimonials"
          >
            <ChevronLeft className="carousel-btn-icon" aria-hidden />
          </button>

          <div
            className={`review-flex-track${showTwoCards ? '' : ' review-flex-track--single'}`}
          >
            {(showTwoCards ? [0, 1] : [0]).map((offset) => {
              const review = reviews[(currentIndex + offset) % reviews.length];
              return (
                <div
                  key={`${currentIndex}-${offset}-${review.id}`}
                  className={`review-card ${review.type}-card`}
                >
                  <div className="quote-icon">
                    <Quote className="quote-icon-svg" size={48} fill="currentColor" aria-hidden />
                  </div>
                  
                  <div className="star-rating">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="review-star" size={18} fill="#fbbf24" color="#fbbf24" aria-hidden />
                    ))}
                  </div>

                  <p className="review-text">"{review.text}"</p>

                  <div className="reviewer-info">
                    <DecodedImage src={review.image} alt={review.name} className="reviewer-img" />
                    <div className="reviewer-details">
                      <h4 className="reviewer-name">{review.name}</h4>
                      <p className="reviewer-role">{review.role}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className="carousel-btn next"
            onClick={nextSlide}
            aria-label="Next testimonials"
          >
            <ChevronRight className="carousel-btn-icon" aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}