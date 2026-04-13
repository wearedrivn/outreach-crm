import type { Metadata } from "next";
import { NavHeader } from "@/components/landing/nav-header";
import { HeroSection } from "@/components/landing/hero-section";
import { ProblemSection } from "@/components/landing/problem-section";
import { SolutionSection } from "@/components/landing/solution-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { DifferentiationSection } from "@/components/landing/differentiation-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { CtaSection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Outreach CRM — Premium Client Acquisition System",
  description:
    "Turn your outreach into a predictable client acquisition machine. Built for high-end businesses that attract premium clients through organic content and strategic outreach.",
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-zinc-950">
      <NavHeader />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <HowItWorksSection />
      <DifferentiationSection />
      <PricingSection />
      <CtaSection />
      <Footer />
    </main>
  );
}
