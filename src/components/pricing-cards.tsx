"use client";

import { useState } from "react";

type Props = {
  currentPlan: "free" | "pro";
};

export function PricingCards({ currentPlan }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpgrade() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      let data;
      try {
        data = await res.json();
      } catch {
        setError(`Server returned ${res.status}. Check Stripe configuration.`);
        setLoading(false);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Failed to start checkout.");
        setLoading(false);
      }
    } catch (err) {
      setError(`Network error: ${(err as Error).message}`);
      setLoading(false);
    }
  }

  async function handleManage() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      let data;
      try {
        data = await res.json();
      } catch {
        setError(`Server returned ${res.status}. Check Stripe configuration.`);
        setLoading(false);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Failed to open billing portal.");
        setLoading(false);
      }
    } catch (err) {
      setError(`Network error: ${(err as Error).message}`);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 animate-slide-up">
      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4 animate-scale-in">
          {error}
        </div>
      )}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Free plan */}
      <div className={`bg-zinc-900/50 border rounded-2xl p-6 ${currentPlan === "free" ? "border-zinc-700" : "border-zinc-800/80"}`}>
        {currentPlan === "free" && (
          <span className="inline-block text-[10px] font-bold uppercase tracking-wide bg-zinc-800 text-zinc-400 px-2.5 py-1 rounded-lg mb-4">
            Current Plan
          </span>
        )}
        <h2 className="text-lg font-semibold text-zinc-100 mb-1">Free</h2>
        <p className="text-3xl font-bold text-zinc-100 mb-1">
          €0<span className="text-sm font-normal text-zinc-500">/month</span>
        </p>
        <p className="text-xs text-zinc-500 mb-6">Get started with the basics</p>
        <ul className="space-y-2.5 text-sm text-zinc-400">
          <li className="flex items-center gap-2.5">
            <CheckIcon />
            10 leads
          </li>
          <li className="flex items-center gap-2.5">
            <CheckIcon />
            CSV import
          </li>
          <li className="flex items-center gap-2.5">
            <CheckIcon />
            Analytics dashboard
          </li>
          <li className="flex items-center gap-2.5">
            <CheckIcon />
            URL-to-lead (5 uses)
          </li>
          <li className="flex items-center gap-2.5 text-zinc-600">
            <XIcon />
            AI-powered messages
          </li>
          <li className="flex items-center gap-2.5 text-zinc-600">
            <XIcon />
            Bulk URL import
          </li>
        </ul>
      </div>

      {/* Pro plan */}
      <div className={`bg-zinc-900/50 border rounded-2xl p-6 ${currentPlan === "pro" ? "border-indigo-500/40" : "border-zinc-800/80"}`}>
        {currentPlan === "pro" && (
          <span className="inline-block text-[10px] font-bold uppercase tracking-wide bg-indigo-500/15 text-indigo-400 px-2.5 py-1 rounded-lg mb-4">
            Current Plan
          </span>
        )}
        <h2 className="text-lg font-semibold text-zinc-100 mb-1">Pro</h2>
        <p className="text-3xl font-bold text-zinc-100 mb-1">
          €29<span className="text-sm font-normal text-zinc-500">/month</span>
        </p>
        <p className="text-xs text-zinc-500 mb-6">Unlimited outreach power</p>
        <ul className="space-y-2.5 text-sm text-zinc-400 mb-6">
          <li className="flex items-center gap-2.5">
            <CheckIcon />
            Unlimited leads
          </li>
          <li className="flex items-center gap-2.5">
            <CheckIcon />
            AI-powered messages
          </li>
          <li className="flex items-center gap-2.5">
            <CheckIcon />
            Bulk URL import
          </li>
          <li className="flex items-center gap-2.5">
            <CheckIcon />
            Unlimited URL-to-lead
          </li>
          <li className="flex items-center gap-2.5">
            <CheckIcon />
            Everything in Free
          </li>
        </ul>

        {currentPlan === "free" ? (
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full text-sm py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-medium rounded-xl transition-all"
          >
            {loading ? "Redirecting..." : "Upgrade to Pro"}
          </button>
        ) : (
          <button
            onClick={handleManage}
            disabled={loading}
            className="w-full text-sm py-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 font-medium rounded-xl transition-all"
          >
            {loading ? "Redirecting..." : "Manage Subscription"}
          </button>
        )}
      </div>
    </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 shrink-0">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-700 shrink-0">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
