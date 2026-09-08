import Header from '@/components/landing/Header';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import BookSection from '@/components/landing/BookSection';
import FooterSection from '@/components/landing/FooterSection';
import Seo from '@/components/Seo';
import '@/styles/LandingPage.css';

export default function HowItWorks() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden flex flex-col">
      <Seo
        title="How It Works | Best Choice Tutors"
        description="Discover how Best Choice Tutors works. Search for tutors, compare profiles, book securely, and start learning with expert guidance."
        ogTitle="How Best Choice Tutors Works"
        ogDescription="Simple steps to find, compare and book expert tutors. Start your learning journey today."
      />
      <Header />
      <main className="flex-1">
        <HowItWorksSection />
        <BookSection />
      </main>
      <FooterSection />
    </div>
  );
}

