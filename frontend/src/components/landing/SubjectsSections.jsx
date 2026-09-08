import React from 'react';
import '../../styles/LandingPage.css';
import { localImageUrl } from '@/utils/s3Assets';
import { DecodedImage } from '@/components/DecodedImage';
import { usePageContent, contentOr, itemsOr } from '@/hooks/usePageContent';

const gcse = localImageUrl('images/gcse.png');
const alevels = localImageUrl('images/A-Levels.png');
const university = localImageUrl('images/University.png');
const languages = localImageUrl('images/All Languages.png');

export default function SubjectsSections() {
  // Built-in tiles, used until an admin supplies their own in Pages > Subjects.
  const defaultSubjects = [
    { name: 'GCSE', image: gcse },
    { name: 'A-Levels', image: alevels },
    { name: 'University', image: university },
    { name: '11+ & SATs', image: languages },
    // More tiles: add entries with localImageUrl('images/…') using files in public/images.
  ];

  const sections = usePageContent('subjects');
  const tiles = sections.tiles;
  const heading = contentOr(tiles, 'heading', 'Educational Levels');
  // Admin items use title/imageUrl; map them onto the shape this markup expects.
  const subjects = itemsOr(tiles, defaultSubjects).map((entry) =>
    entry.name !== undefined
      ? entry
      : { name: entry.title, image: entry.imageUrl || '', alt: entry.imageAlt },
  );

  return (
    <section className="subjects-section">
      <div className="subjects-container">
        {/* <h2 className="section-title">Mathematics Tutors</h2>
        <h2 className="section-title">Physics Tutors</h2>
        <h2 className="section-title">English Tutors</h2> */}
        <h2 className="section-title">{heading}</h2>

        <div className="subjects-flex-grid">
          {subjects.map((subject, index) => (
            <div key={index} className="subject-card">
              <div className="subject-image-container">
                <DecodedImage src={subject.image} alt={subject.alt || subject.name} />
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

