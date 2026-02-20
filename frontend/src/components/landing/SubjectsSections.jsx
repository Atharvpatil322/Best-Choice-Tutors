import React from 'react';
import '../../styles/LandingPage.css';
import gcse from '../../images/gcse.png'
import alevels from '../../images/A-Levels.png'
import university from '../../images/University.png'
import languages from '../../images/All Languages.png'
import biology from '../../images/Biology.png'
import history from '../../images/History.png'
import geography from '../../images/Geography.png'
import computerScience from '../../images/Computer Science.png'
import mathematics from '../../images/Mathematics.png'
import englishLiterature from '../../images/English Literature.png'
import physics from '../../images/Physics.png'
import chemistry from '../../images/Chemistry.png'

// Import your subject images here
// import gcseImg from '../../images/subjects/gcse.jpg'; 
// ... etc

export default function SubjectsSections() {
  const subjects = [
    { name: 'GCSE', image: gcse },
    { name: 'A-Levels', image: alevels },
    { name: 'University', image: university },
    { name: 'All Languages', image: languages},
    { name: 'Biology', image: biology },
    { name: 'History', image: history },
    { name: 'Geography', image: geography },
    { name: 'Computer Science', image: computerScience },
    { name: 'Mathematics', image: mathematics },
    { name: 'English Literature', image: englishLiterature },
    { name: 'Physics', image: physics },
    { name: 'Chemistry', image: chemistry },
  ];

  return (
    <section className="subjects-section">
      <div className="subjects-container">
        <h2 className="section-title">Popular Subjects & Education Levels</h2>
        
        <div className="subjects-flex-grid">
          {subjects.map((subject, index) => (
            <div key={index} className="subject-card">
              <div className="subject-image-container">
                <img src={subject.image} alt={subject.name} />
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