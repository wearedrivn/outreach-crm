"use client";

import { useInView } from "./use-in-view";
import { UploadIcon, ScoringIcon, MessageIcon, HandshakeIcon } from "./icons";

const STEPS = [
  {
    num: 1,
    icon: UploadIcon,
    title: "Add Leads",
    description: "Manually, CSV import, or paste a URL",
  },
  {
    num: 2,
    icon: ScoringIcon,
    title: "Auto-Score",
    description: "Brand strength, content quality, and revenue scored instantly",
  },
  {
    num: 3,
    icon: MessageIcon,
    title: "Generate Outreach",
    description: "AI-crafted messages tailored to each prospect",
  },
  {
    num: 4,
    icon: HandshakeIcon,
    title: "Close Clients",
    description: "Track conversations and close high-end deals consistently",
  },
];

export function HowItWorksSection() {
  const { ref, isVisible } = useInView();

  return (
    <section id="how-it-works" className="py-24 md:py-32 bg-zinc-900/30">
      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-16 ${isVisible ? "scroll-visible" : "scroll-hidden"}`}>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            How It Works
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mt-4">
            From lead to client in 4 steps
          </h2>
        </div>

        {/* Steps grid */}
        <div className="relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden lg:block absolute top-[4.5rem] left-[12.5%] right-[12.5%] h-px border-t border-dashed border-zinc-800" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className={`relative bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 text-center hover:-translate-y-1 hover:border-zinc-700/50 transition-all ${
                    isVisible ? "scroll-visible" : "scroll-hidden"
                  }`}
                  style={{
                    transitionDelay: isVisible ? `${i * 0.15}s` : "0s",
                  }}
                >
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-sm font-bold text-white mx-auto mb-4">
                    {step.num}
                  </div>
                  <Icon className="text-zinc-400 mx-auto mb-3" size={32} />
                  <h3 className="text-base font-semibold text-zinc-100 mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm text-zinc-400">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
