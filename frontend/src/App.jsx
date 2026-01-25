import Header from "@/components/landing/Header"
import HeroSection from "@/components/landing/HeroSection"
import TutorSearch from "@/components/landing/TutorSearch"
import HeroImageSection from "@/components/landing/HeroImageSection"
import TrustSection from "@/components/landing/TrustSection"

function App() {
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
  )
}

export default App
