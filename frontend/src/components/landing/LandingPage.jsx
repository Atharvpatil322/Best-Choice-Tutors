/**
 * Landing Page Component
 * Main landing page with existing components
 */

import Header from "./Header";
import HeroSection from "./HeroSection";
import TutorSearch from "./TutorSearch";
import HeroImageSection from "./HeroImageSection";
import TrustSection from "./TrustSection";

function LandingPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <TutorSearch />
        <HeroImageSection />
        <TrustSection />
      </main>
    </div>
  );
}

export default LandingPage;
