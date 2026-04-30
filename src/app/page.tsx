import Navbar         from '@/components/landing/Navbar'
import HeroSection    from '@/components/landing/HeroSection'
import ProblemSection from '@/components/landing/ProblemSection'

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <ProblemSection />
      </main>
    </>
  )
}
