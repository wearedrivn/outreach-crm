"use client";

import { useInView } from "./use-in-view";
import { BrokenTargetIcon } from "./icons";

export function ProblemSection() {
  const { ref, isVisible } = useInView();

  return (
    <section id="problem" className="py-24 md:py-32 bg-zinc-900/50">
      <div
        ref={ref}
        className={`max-w-2xl mx-auto px-4 sm:px-6 text-center ${isVisible ? "scroll-visible" : "scroll-hidden"}`}
      >
        <BrokenTargetIcon className="text-zinc-500 mx-auto mb-6" />

        <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
          The Problem
        </span>

        <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mt-4">
          You have a premium offer. But your content doesn&apos;t reflect it.
        </h2>

        <div className="mt-8 space-y-3">
          <p
            className="text-lg text-zinc-400"
            style={{ transitionDelay: isVisible ? "0.1s" : "0s" }}
          >
            Your outreach feels random.
          </p>
          <p
            className="text-lg text-zinc-400"
            style={{ transitionDelay: isVisible ? "0.2s" : "0s" }}
          >
            And the right clients aren&apos;t coming in consistently.
          </p>
        </div>

        <div className="w-12 h-px bg-indigo-500/40 mx-auto my-8" />

        <p
          className="text-xl font-semibold text-zinc-100"
          style={{ transitionDelay: isVisible ? "0.4s" : "0s" }}
        >
          You don&apos;t need more leads. You need better ones.
        </p>
      </div>
    </section>
  );
}
