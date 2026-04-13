"use client";

import Link from "next/link";
import { useInView } from "./use-in-view";

export function CtaSection() {
  const { ref, isVisible } = useInView();

  return (
    <section className="relative py-24 md:py-32">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div
        ref={ref}
        className={`relative max-w-2xl mx-auto px-4 sm:px-6 text-center ${
          isVisible ? "scroll-visible" : "scroll-hidden"
        }`}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-zinc-100">
          If your brand is premium, your outreach should be too.
        </h2>
        <p className="text-lg text-zinc-400 mt-4">
          Start building your client acquisition system today.
        </p>
        <div className="mt-8">
          <Link
            href="/register"
            className="inline-flex items-center px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-base transition-all hover:shadow-lg hover:shadow-indigo-500/20"
          >
            Start Free
          </Link>
          <p className="text-sm text-zinc-500 mt-3">No credit card required</p>
        </div>
      </div>
    </section>
  );
}
