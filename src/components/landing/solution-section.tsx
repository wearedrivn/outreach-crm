"use client";

import { useInView } from "./use-in-view";
import {
  TargetIcon,
  ChartDownIcon,
  MessageIcon,
  FolderIcon,
  PipelineIcon,
  CheckIcon,
} from "./icons";

const FEATURES = [
  { icon: TargetIcon, text: "Identify high-value prospects instantly" },
  { icon: ChartDownIcon, text: "Spot brands with money but weak content" },
  { icon: MessageIcon, text: "Generate premium outreach messages in seconds" },
  { icon: FolderIcon, text: "Track every conversation in one place" },
  { icon: PipelineIcon, text: "Build a consistent pipeline of qualified clients" },
];

export function SolutionSection() {
  const { ref, isVisible } = useInView();

  return (
    <section id="solution" className="py-24 md:py-32">
      <div
        ref={ref}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Text column */}
          <div className={isVisible ? "scroll-visible" : "scroll-hidden"}>
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
              The Solution
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mt-4">
              This is not a CRM. This is your client acquisition system.
            </h2>
          </div>

          {/* Feature rows */}
          <div className="space-y-3">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.text}
                  className={`flex items-center gap-4 bg-zinc-900/50 border border-zinc-800/30 rounded-xl px-4 py-3 ${
                    isVisible ? "scroll-visible" : "scroll-hidden"
                  }`}
                  style={{
                    transitionDelay: isVisible ? `${(i + 1) * 0.1}s` : "0s",
                  }}
                >
                  <Icon className="text-zinc-400 shrink-0" size={20} />
                  <CheckIcon className="text-emerald-400 shrink-0" size={14} />
                  <span className="text-sm text-zinc-300">{feature.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
