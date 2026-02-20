import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import heroImage from '../../images/Hero_Section_Image.png';
import { getAllTutors } from '../../services/tutorService';
import { isAuthenticated } from '../../lib/auth';
import LandingTutorCard from './LandingTutorCard';
import '../../styles/LandingPage.css';

export default function HeroSection() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    subject: '',
    price: '',
    mode: '',
    gender: '',
  });
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const CARDS_PER_PAGE = 3;
  const [pagination, setPagination] = useState({
    page: 1,
    limit: CARDS_PER_PAGE,
    totalCount: 0,
    totalPages: 0,
  });
  const [hasSearched, setHasSearched] = useState(false);

  // Available subjects
  const availableSubjects = [
    'Mathematics',
    'English',
    'Science',
    'Physics',
    'Chemistry',
    'Biology',
    'History',
    'Geography',
    'French',
    'Spanish',
    'German',
    'Computer Science',
    'Economics',
    'Business Studies',
    'Psychology',
    'Art',
    'Music',
    'Drama',
    'Physical Education',
    'Other',
  ];

  const teachingModes = [
    { value: '', label: 'All Modes' },
    { value: 'Online', label: 'Online' },
    { value: 'In-Person', label: 'In-Person' },
    { value: 'Both', label: 'Both' },
  ];

  const priceRanges = [
    { value: '', label: 'Any Price' },
    { value: '0-30', label: '£0 - £30', min: 0, max: 30 },
    { value: '30-40', label: '£30 - £40', min: 30, max: 40 },
    { value: '40-50', label: '£40 - £50', min: 40, max: 50 },
    { value: '50+', label: '£50+', min: 50, max: null },
  ];

  const genderOptions = [
    { value: '', label: 'Any' },
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
  ];

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };

  const handleSearch = async (page = 1) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      // Build filter params
      const filterParams = {
        page,
        limit: CARDS_PER_PAGE,
      };

      if (filters.subject) {
        filterParams.subject = filters.subject;
      }

      if (filters.mode) {
        filterParams.mode = filters.mode;
      }

      if (filters.price) {
        const priceRange = priceRanges.find((r) => r.value === filters.price);
        if (priceRange) {
          if (priceRange.min !== undefined) {
            filterParams.priceMin = priceRange.min;
          }
          if (priceRange.max !== undefined && priceRange.max !== null) {
            filterParams.priceMax = priceRange.max;
          }
        }
      }

      if (filters.gender) {
        filterParams.gender = filters.gender;
      }

      const data = await getAllTutors(filterParams);
      setTutors(data.tutors || []);
      setPagination(data.pagination || {
        page: 1,
        limit: CARDS_PER_PAGE,
        totalCount: 0,
        totalPages: 0,
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch tutors');
      setTutors([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      handleSearch(newPage);
      const tutorSection = document.querySelector('.tutor-results-section');
      if (tutorSection) {
        tutorSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div className="hero-main-wrapper">
      <div className="hero-container">
        <section className="hero-content">
          {/* LEFT SIDE */}
          <div className="hero-text">
            <h1 className="hero-title">
              Connecting You With Trusted Tutors – Online & In-Person
            </h1>
            <p className="hero-subtitle">
              Book qualified, verified tutors for GCSE, A-Levels, 11+, University & more.
              Safe payments. Flexible scheduling. Trusted by parents and students.
            </p>

            <div className="search-filter-box">
              <select
                className="filter-input"
                value={filters.subject}
                onChange={(e) => handleFilterChange('subject', e.target.value)}
              >
                <option value="">All Subjects</option>
                {availableSubjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>

              <select
                className="filter-input"
                value={filters.price}
                onChange={(e) => handleFilterChange('price', e.target.value)}
              >
                {priceRanges.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>

              <select
                className="filter-input"
                value={filters.mode}
                onChange={(e) => handleFilterChange('mode', e.target.value)}
              >
                {teachingModes.map((mode) => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </select>

              <select
                className="filter-input"
                value={filters.gender}
                onChange={(e) => handleFilterChange('gender', e.target.value)}
              >
                {genderOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <button
                className="btn-book-hero"
                onClick={() => handleSearch(1)}
                disabled={loading}
              >
                {loading ? 'Searching...' : 'Search Tutor'}
              </button>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="hero-image-wrapper">
            <div className="image-mask">
              <img
                src={heroImage}
                alt="Tutor teaching a student"
              />
            </div>
            <div className="decorative-circle teal-circle"></div>
            <div className="decorative-circle red-circle"></div>
          </div>
        </section>
      </div>

      {/* Tutor Results Section - above features strip, 3 cards per row with slide pagination */}
      {hasSearched && (
        <div className="tutor-results-section" style={{ width: '100%', padding: '3rem 1.5rem', backgroundColor: '#f8fafc' }}>
          <div className="container" style={{ maxWidth: '1280px', margin: '0 auto' }}>
            {/* Guest Disclaimer */}
            {!isAuthenticated() && (
              <div style={{
                marginBottom: '2rem',
                padding: '1rem 1.5rem',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '12px',
                color: '#856404',
                textAlign: 'center',
                fontSize: '0.9375rem',
              }}>
                To book a tutor, please log in or create an account.
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div style={{
                marginBottom: '2rem',
                padding: '1rem 1.5rem',
                backgroundColor: '#f8d7da',
                border: '1px solid #f5c6cb',
                borderRadius: '12px',
                color: '#721c24',
                textAlign: 'center',
              }}>
                {error}
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ fontSize: '1.125rem', color: '#64748b' }}>Loading tutors...</p>
              </div>
            )}

            {/* Tutor Cards - single row of 3 with pagination to next slide */}
            {!loading && tutors.length > 0 && (
              <>
                <div className="tutor-cards-row">
                  {tutors.map((tutor) => (
                    <LandingTutorCard key={tutor.id} tutor={tutor} />
                  ))}
                </div>

                {/* Pagination - next/previous slide within row */}
                {pagination.totalPages > 1 && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginTop: '1.5rem',
                    }}
                  >
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      style={{
                        padding: '0.5rem 1rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        backgroundColor: pagination.page === 1 ? '#f1f5f9' : '#ffffff',
                        color: pagination.page === 1 ? '#94a3b8' : '#1a365d',
                        cursor: pagination.page === 1 ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                      }}
                    >
                      Previous
                    </button>
                    <span
                      style={{
                        padding: '0.5rem 1rem',
                        color: '#64748b',
                        fontSize: '0.9375rem',
                      }}
                    >
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      style={{
                        padding: '0.5rem 1rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        backgroundColor: pagination.page === pagination.totalPages ? '#f1f5f9' : '#ffffff',
                        color: pagination.page === pagination.totalPages ? '#94a3b8' : '#1a365d',
                        cursor: pagination.page === pagination.totalPages ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                      }}
                    >
                      Next
                    </button>
                  </div>
                )}

                <div
                  style={{
                    textAlign: 'center',
                    marginTop: '1rem',
                    color: '#64748b',
                    fontSize: '0.875rem',
                  }}
                >
                  Showing {tutors.length} of {pagination.totalCount} tutors
                </div>
              </>
            )}

            {/* No Results */}
            {!loading && tutors.length === 0 && !error && (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No tutors found</p>
                <p style={{ fontSize: '0.9375rem' }}>Try adjusting your filters to see more results.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FEATURES STRIP (below tutor results) */}
      <div className="features-strip">
        <div className="feature-item">
          <div className="feature-icon">✓</div>
          <h3 className="feature-title">Certified Professionals</h3>
          <p className="feature-desc">All tutors are rigorously vetted and hold relevant qualifications.</p>
        </div>
        <div className="feature-item">
          <div className="feature-icon">🔒</div>
          <h3 className="feature-title">Background Verified</h3>
          <p className="feature-desc">Your financial transactions are protected with industry-leading security.</p>
        </div>
        <div className="feature-item">
          <div className="feature-icon">👥</div>
          <h3 className="feature-title">Dedicated Parent Support</h3>
          <p className="feature-desc">Our team is here to assist you every step of the way, 24/7.</p>
        </div>
      </div>
    </div>
  );
}
