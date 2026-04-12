import React from 'react';
import '../../styles/LandingPage.css';
import { localImageUrl } from '@/utils/s3Assets';
import { DecodedImage } from '@/components/DecodedImage';

const gcse = localImageUrl('images/gcse.png');
const alevels = localImageUrl('images/A-Levels.png');
const university = localImageUrl('images/University.png');
const languages = localImageUrl('images/All Languages.png');
const biology = localImageUrl('images/Biology.png');
const history = localImageUrl('images/History.png');
const geography = localImageUrl('images/Geography.png');
const computerScience = localImageUrl('images/Computer Science.png');
const mathematics = localImageUrl('images/Mathematics.png');
const englishLiterature = localImageUrl('images/English Literature.png');
const physics = localImageUrl('images/Physics.png');
const chemistry = localImageUrl('images/Chemistry.png');

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

