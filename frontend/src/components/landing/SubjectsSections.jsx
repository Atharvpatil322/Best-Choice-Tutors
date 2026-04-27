import React from 'react';
import '../../styles/LandingPage.css';
import { localImageUrl } from '@/utils/s3Assets';
import { DecodedImage } from '@/components/DecodedImage';

const gcse = localImageUrl('images/gcse.png');
const alevels = localImageUrl('images/A-Levels.png');
const university = localImageUrl('images/University.png');
const languages = localImageUrl('images/All Languages.png');

export default function SubjectsSections() {
  const subjects = [
    { name: 'GCSE', image: gcse },
    { name: 'A-Levels', image: alevels },
    { name: 'University', image: university },
    { name: '11+ & SATs', image: languages },
    // More tiles: add entries with localImageUrl('images/…') using files in public/images.
  ];

  return (
    <section className="subjects-section">
      <div className="subjects-container">
        {/* <h2 className="section-title">Mathematics Tutors</h2>
        <h2 className="section-title">Physics Tutors</h2>
        <h2 className="section-title">English Tutors</h2> */}
        <h2 className="section-title">Education Levels</h2>

        <div className="subjects-flex-grid">
          {subjects.map((subject, index) => (
            <div key={index} className="subject-card">
              <div className="subject-image-container">
                <DecodedImage src={subject.image} alt={subject.name} />
              </div>
              <div className="subject-footer">
                <span>{subject.name}</span>
              </div>
            </div>
          ))}
        </div>

        {/* <div className="view-more-container">
          <button className="btn-view-more">View More</button>
        </div> */}
      </div>
    </section>
  );
}

