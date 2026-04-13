"use client";

import { useInView } from "./use-in-view";
import { DiamondIcon, CheckIcon, XIcon } from "./icons";

const COMPARISONS = [
  { others: "Optimize for volume", ours: "Optimize for positioning" },
  { others: "More leads, more noise", ours: "Fewer leads, higher quality" },
  { others: "Generic templates", ours: "Tailored premium messaging" },
  { others: "Built for everyone", ours: "Built for premium brands" },
];

export function DifferentiationSection() {
  const { ref, isVisible } = useInView();

  return (
    <section className="py-24 md:py-32">
      <div ref={ref} className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className={`text-center mb-16 ${isVisible ? "scroll-visible" : "scroll-hidden"}`}>
          <DiamondIcon className="text-indigo-400 mx-auto mb-6" />
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Why Us
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mt-4 max-w-2xl mx-auto">
            Most outreach tools optimize for volume. We optimize for positioning.
          </h2>
        </div>

        {/* Comparison rows */}
        <div className="space-y-3">
          {COMPARISONS.map((row, i) => (
            <div
              key={row.ours}
              className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${
                isVisible ? "scroll-visible" : "scroll-hidden"
              }`}
              style={{
                transitionDelay: isVisible ? `${i * 0.1}s` : "0s",
              }}
            >
              <div className="flex items-center gap-3 bg-zinc-800 rounded-xl px-4 py-3">
                <XIcon className="text-red-400 shrink-0" size={14} />
                <span className="text-sm text-zinc-500">{row.others}</span>
              </div>
              <div className="flex items-center gap-3 bg-zinc-900 border border-indigo-500/10 rounded-xl px-4 py-3">
                <CheckIcon className="text-emerald-400 shrink-0" size={14} />
                <span className="text-sm text-zinc-200">{row.ours}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Callout */}
        <div
          className={`mt-12 bg-zinc-900 border-l-2 border-indigo-500 rounded-xl px-6 py-5 ${
            isVisible ? "scroll-visible" : "scroll-hidden"
          }`}
          style={{ transitionDelay: isVisible ? "0.5s" : "0s" }}
        >
          <p className="text-lg text-zinc-200 italic">
            Booked 3 high-ticket clients in 2 weeks using this system.
          </p>
        </div>
      </div>
    </section>
  );
}
