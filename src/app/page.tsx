import Navbar           from '@/components/landing/Navbar'
import HeroSection      from '@/components/landing/HeroSection'
import ProblemSection   from '@/components/landing/ProblemSection'
import SolutionSection  from '@/components/landing/SolutionSection'
import PricingSection   from '@/components/landing/PricingSection'
import TrustSection     from '@/components/landing/TrustSection'
import FAQSection       from '@/components/landing/FAQSection'
import FinalCTASection  from '@/components/landing/FinalCTASection'
import Footer           from '@/components/landing/Footer'

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <PricingSection />
        <TrustSection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <Footer />
    </>
  )
}
