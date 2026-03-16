import Header from "./Header";
import HeroSection from "./HeroSection";
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
import Seo from "../Seo";

function LandingPage() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <Seo
        title="Best Choice Tutors | Find Expert Tutors Online"
        description="Find expert tutors online and in-person for Mathematics, Physics, English, Languages, GCSE, A-Levels and university. Compare vetted tutors and book securely."
        keywords="find expert tutors online, maths tutor online, physics tutor online, English tutor, language tutor, GCSE tutoring, A-Level tutoring, online tuition platform"
        ogTitle="Find Expert Tutors Online | Best Choice Tutors"
        ogDescription="Connect with expert tutors for Mathematics, Physics, English and Languages. Learn online or in-person with a trusted UK tutoring platform."
        ogType="website"
      />
      <Header />
      <main className="w-full overflow-x-hidden">
        <HeroSection />
        {/* <TutorSearch /> */}
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
