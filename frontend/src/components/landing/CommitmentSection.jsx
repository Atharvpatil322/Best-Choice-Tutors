import React from 'react';
import { Eye, Award, CheckCircle2 } from 'lucide-react';
import '../../styles/LandingPage.css';

export default function CommitmentSection() {
  return (
    <section className="commitment-section">
      <div className="commitment-container">
        <h2 className="commitment-main-title">
          Our Commitment to Quality <br />
        </h2>

        <div className="commitment-flex-row">
          {/* Card 1: Background Checks */}
          <div className="commitment-card">
            <div className="commitment-header">
              <div className="commitment-icon-box bg-red-soft">
                <Eye className="text-red" size={28} />
              </div>
              <h3>Rigorous Background Checks</h3>
            </div>
            <p className="commitment-desc">
              We ensure the safety and trustworthiness of our tutors.
            </p>
           <div className="commitment-footer-list">
  <div className="list-item1">
    <CheckCircle2 size={18} className="shrink-0" />
    <span>DBS Certified (UK)</span>
  </div>
  <div className="list-item1">
    <CheckCircle2 size={18} className="shrink-0" />
    <span>Identity Verified</span>
  </div>
  <div className="list-item1">
    <CheckCircle2 size={18} className="shrink-0" />
    <span>Criminal Record Checked</span>
  </div>
</div>
          </div>

          {/* Card 2: Academic Qualifications */}
          <div className="commitment-card">
            <div className="commitment-header">
              <div className="commitment-icon-box bg-red-soft">
                <Award className="text-red" size={28} />
              </div>
              <h3>Verified Academic Qualifications</h3>
            </div>
            <p className="commitment-desc">
              Every tutor's expertise is confirmed for your peace of mind.
            </p>
            <div className="commitment-footer-list">
              <div className="list-item1">
                <CheckCircle2 size={18} />
                <span>Educational Level</span>
              </div>
              <div className="list-item1">
                <CheckCircle2 size={18} />
                <span>Subject Knowledge</span>
              </div>
              <div className="list-item1">
                <CheckCircle2 size={18} />
                <span>Experienced Professionals</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}