import React from 'react';
import '../../styles/LandingPage.css';
import { s3ImageUrl } from '@/utils/s3Assets';
import { DecodedImage } from '@/components/DecodedImage';

const gcse = s3ImageUrl('images/gcse.png');
const alevels = s3ImageUrl('images/A-Levels.png');
const university = s3ImageUrl('images/University.png');
const languages = s3ImageUrl('images/All Languages.png');
const biology = s3ImageUrl('images/Biology.png');
const history = s3ImageUrl('images/History.png');
const geography = s3ImageUrl('images/Geography.png');
const computerScience = s3ImageUrl('images/Computer Science.png');
const mathematics = s3ImageUrl('images/Mathematics.png');
const englishLiterature = s3ImageUrl('images/English Literature.png');
const physics = s3ImageUrl('images/Physics.png');
const chemistry = s3ImageUrl('images/Chemistry.png');

// Import your subject images here
// import gcseImg from '../../images/subjects/gcse.jpg'; 
// ... etc

export default function SubjectsSections() {
  const subjects = [
    { name: 'GCSE', image: gcse },
    { name: 'A-Levels', image: alevels },
    { name: 'University', image: university },
    { name: '11+ & SATs', image: languages},
    // { name: 'Biology', image: biology },
    // { name: 'History', image: history },
    // { name: 'Geography', image: geography },
    // { name: 'Computer Science', image: computerScience },
    // { name: 'Mathematics', image: mathematics },
    // { name: 'English Literature', image: englishLiterature },
    // { name: 'Physics', image: physics },
    // { name: 'Chemistry', image: chemistry },
  ];

  return (
    <section className="subjects-section">
      <div className="subjects-container">
        {/* <h2 className="section-title">Mathematics Tutors</h2>
        <h2 className="section-title">Physics Tutors</h2>
        <h2 className="section-title">English Tutors</h2> */}
        <h2 className="section-title">Popular Subjects & Education Levels</h2>

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
