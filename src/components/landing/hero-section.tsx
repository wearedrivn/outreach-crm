import Link from "next/link";
import { DashboardMockup } from "./dashboard-mockup";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-16">
      {/* Background glow */}
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text column */}
          <div className="animate-slide-up">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-zinc-100 tracking-tight leading-[1.1]">
              Turn your outreach into a predictable client acquisition machine.
            </h1>
            <p className="text-lg text-zinc-400 mt-6 max-w-lg">
              We help high-end businesses attract premium clients through organic
              content and strategic outreach — no ads, no trends.
            </p>
            <div className="mt-8">
              <Link
                href="/register"
                className="inline-flex items-center px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-base transition-all hover:shadow-lg hover:shadow-indigo-500/20"
              >
                Get Started
              </Link>
              <p className="text-sm text-zinc-500 mt-3">
                Free plan available — no credit card required
              </p>
            </div>
          </div>

          {/* Dashboard mockup column */}
          <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <DashboardMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
