import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import MarketsTicker from "@/components/site/MarketsTicker";
import Hero from "@/components/landing/Hero";
import TraderMarquee from "@/components/landing/TraderMarquee";
import StatsStrip from "@/components/landing/StatsStrip";
import HowItWorks from "@/components/landing/HowItWorks";
import TopTradersSection from "@/components/landing/TopTradersSection";
import Features from "@/components/landing/Features";
import Protection from "@/components/landing/Protection";
import Fees from "@/components/landing/Fees";
import Testimonials from "@/components/landing/Testimonials";
import FAQ from "@/components/landing/FAQ";
import CTA from "@/components/landing/CTA";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <MarketsTicker />
        <TraderMarquee />
        <StatsStrip />
        <HowItWorks />
        <TopTradersSection />
        <Features />
        <Protection />
        <Fees />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
