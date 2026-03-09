import Header from '@/components/landing/Header';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import BookSection from '@/components/landing/BookSection';
import FooterSection from '@/components/landing/FooterSection';
import '@/styles/LandingPage.css';

export default function HowItWorks() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden flex flex-col">
      <Header />
      <main className="flex-1">
        <HowItWorksSection />
        <BookSection />
      </main>
      <FooterSection />
    </div>
  );
}

