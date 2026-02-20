/**
 * Landing Page Component
 * Main landing page with existing components
 */

import Header from "./Header";
import HeroSection from "./HeroSection";
import HowItWorksSection from "./HowItWorksSection";
import TutorSearch from "./TutorSearch";
import HeroImageSection from "./HeroImageSection";
import TrustSection from "./TrustSection";
import WelcomeSection from "./WelcomeSection";
import SubjectsSections from "./SubjectsSections";
import CommitmentSection from "./CommitmentSection";
import ReachSection from "./ReachSection";
import ReviewSection from "./ReviewSection";
import BookSection from "./BookSection";
import FaqSection from "./FaqSection";
import FooterSection from "./FooterSection";

function LandingPage() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <Header />
      <main className="w-full overflow-x-hidden">
        <HeroSection />
        {/* <TutorSearch /> */}
        <HowItWorksSection />
        <WelcomeSection />
        <SubjectsSections />
        <CommitmentSection />
        <ReachSection />
        <ReviewSection />
        <BookSection />
        <FaqSection />
        <FooterSection />
        
        {/* <HeroImageSection /> */}
        {/* <TrustSection /> */}
      </main>
    </div>
  );
}

export default LandingPage;
