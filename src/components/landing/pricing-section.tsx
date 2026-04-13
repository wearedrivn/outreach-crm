"use client";

import Link from "next/link";
import { useInView } from "./use-in-view";

export function PricingSection() {
  const { ref, isVisible } = useInView();

  return (
    <section id="pricing" className="py-24 md:py-32 bg-zinc-900/30">
      <div ref={ref} className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className={`text-center mb-16 ${isVisible ? "scroll-visible" : "scroll-hidden"}`}>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Pricing
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mt-4">
            Simple, transparent pricing
          </h2>
        </div>

        {/* Cards */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isVisible ? "scroll-visible" : "scroll-hidden"}`} style={{ transitionDelay: isVisible ? "0.2s" : "0s" }}>
          {/* Free */}
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-zinc-100 mb-1">Free</h3>
            <p className="text-3xl font-bold text-zinc-100 mb-1">
              €0<span className="text-sm font-normal text-zinc-500">/month</span>
            </p>
            <p className="text-xs text-zinc-500 mb-6">Get started with the basics</p>
            <ul className="space-y-2.5 text-sm text-zinc-400 mb-6">
              <li className="flex items-center gap-2.5">
                <CheckSvg />
                10 leads
              </li>
              <li className="flex items-center gap-2.5">
                <CheckSvg />
                CSV import
              </li>
              <li className="flex items-center gap-2.5">
                <CheckSvg />
                Analytics dashboard
              </li>
              <li className="flex items-center gap-2.5">
                <CheckSvg />
                URL-to-lead (5 uses)
              </li>
              <li className="flex items-center gap-2.5 text-zinc-600">
                <XSvg />
                AI-powered messages
              </li>
              <li className="flex items-center gap-2.5 text-zinc-600">
                <XSvg />
                Bulk URL import
              </li>
            </ul>
            <Link
              href="/register"
              className="block w-full text-center text-sm py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl transition-all"
            >
              Start Free
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-zinc-900/50 border border-indigo-500/40 rounded-2xl p-6">
            <span className="inline-block text-[10px] font-bold uppercase tracking-wide bg-indigo-500/15 text-indigo-400 px-2.5 py-1 rounded-lg mb-4">
              Most Popular
            </span>
            <h3 className="text-lg font-semibold text-zinc-100 mb-1">Pro</h3>
            <p className="text-3xl font-bold text-zinc-100 mb-1">
              €29<span className="text-sm font-normal text-zinc-500">/month</span>
            </p>
            <p className="text-xs text-zinc-500 mb-6">Unlimited outreach power</p>
            <ul className="space-y-2.5 text-sm text-zinc-400 mb-6">
              <li className="flex items-center gap-2.5">
                <CheckSvg />
                Unlimited leads
              </li>
              <li className="flex items-center gap-2.5">
                <CheckSvg />
                AI-powered messages
              </li>
              <li className="flex items-center gap-2.5">
                <CheckSvg />
                Bulk URL import
              </li>
              <li className="flex items-center gap-2.5">
                <CheckSvg />
                Unlimited URL-to-lead
              </li>
              <li className="flex items-center gap-2.5">
                <CheckSvg />
                Everything in Free
              </li>
            </ul>
            <Link
              href="/register"
              className="block w-full text-center text-sm py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function CheckSvg() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 shrink-0">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XSvg() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-700 shrink-0">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
