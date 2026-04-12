"use client";

import { useState } from "react";
import type { Lead } from "@prisma/client";

type Props = {
  lead: Lead;
  onClose: () => void;
};

function SkeletonLines() {
  return (
    <div className="space-y-3 py-2">
      <div className="h-3.5 bg-zinc-800 rounded-lg w-full animate-shimmer" />
      <div className="h-3.5 bg-zinc-800 rounded-lg w-11/12 animate-shimmer" style={{ animationDelay: "0.1s" }} />
      <div className="h-3.5 bg-zinc-800 rounded-lg w-10/12 animate-shimmer" style={{ animationDelay: "0.2s" }} />
      <div className="h-3.5 bg-zinc-800 rounded-lg w-full animate-shimmer" style={{ animationDelay: "0.3s" }} />
      <div className="h-3.5 bg-zinc-800 rounded-lg w-9/12 animate-shimmer" style={{ animationDelay: "0.4s" }} />
    </div>
  );
}

export function MessageModal({ lead, onClose }: Props) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [messageType, setMessageType] = useState<"outreach" | "followup">("outreach");

  async function generate(type: "outreach" | "followup") {
    setLoading(true);
    setError("");
    setCopied(false);
    setMessageType(type);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id, type }),
      });

      if (!res.ok) throw new Error("Failed to generate message");

      const data = await res.json();
      setMessage(data.message);
    } catch {
      setError("Failed to generate message. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isHighOpp =
    lead.brandScore >= 7 && lead.revenueScore >= 7 && lead.contentScore <= 5;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm overlay-backdrop p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl shadow-black/40 animate-scale-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-semibold tracking-tight truncate">{lead.companyName}</h2>
              {isHighOpp && (
                <span className="shrink-0 bg-orange-500/15 text-orange-400 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide">
                  High Opp
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5 mt-1">
              <span className="text-xs text-zinc-500">{lead.niche}</span>
              <span className="text-xs text-indigo-400 font-mono">{lead.instagramHandle}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors shrink-0 ml-3"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scores bar */}
        <div className="flex items-center gap-5 px-6 pb-5 text-xs text-zinc-500">
          <span>Brand <span className="text-zinc-300 font-medium tabular-nums">{lead.brandScore}/10</span></span>
          <span>Content <span className="text-zinc-300 font-medium tabular-nums">{lead.contentScore}/10</span></span>
          <span>Revenue <span className="text-zinc-300 font-medium tabular-nums">{lead.revenueScore}/10</span></span>
        </div>

        <div className="border-t border-zinc-800/60" />

        {/* Content area */}
        <div className="p-6">
          {error && (
            <div className="mb-5 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 animate-scale-in">
              {error}
            </div>
          )}

          {/* Initial state — generate buttons */}
          {!message && !loading && (
            <div className="text-center py-8 animate-fade-in">
              <p className="text-zinc-500 text-sm mb-6">
                Generate a personalized outreach message for {lead.companyName}
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button
                  onClick={() => generate("outreach")}
                  className="text-sm px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-500 active:bg-indigo-700 transition-all duration-150"
                >
                  Generate Outreach
                </button>
                <button
                  onClick={() => generate("followup")}
                  className="text-sm px-5 py-2.5 bg-zinc-800 text-zinc-300 font-medium rounded-xl hover:bg-zinc-700 transition-colors"
                >
                  Generate Follow-up
                </button>
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="py-4 animate-fade-in">
              <div className="text-[11px] uppercase tracking-wider text-zinc-600 font-medium mb-3">
                {messageType === "outreach" ? "Generating outreach..." : "Generating follow-up..."}
              </div>
              <div className="bg-zinc-800/30 rounded-xl p-5 border-l-2 border-indigo-500/30">
                <SkeletonLines />
              </div>
            </div>
          )}

          {/* Generated message */}
          {message && !loading && (
            <div className="animate-fade-in">
              <div className="text-[11px] uppercase tracking-wider text-indigo-400/80 font-semibold mb-3">
                {messageType === "outreach" ? "Initial Outreach" : "Follow-up"}
              </div>
              <div className="bg-zinc-800/30 border-l-2 border-indigo-500 rounded-xl p-5 text-sm leading-relaxed text-zinc-300 whitespace-pre-line">
                {message}
              </div>
              <div className="flex flex-wrap gap-2.5 mt-5">
                <button
                  onClick={handleCopy}
                  className={`text-sm px-4 py-2.5 font-medium rounded-xl transition-all duration-200 flex items-center gap-2 ${
                    copied
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                      : "bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700"
                  }`}
                >
                  {copied ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Copied
                    </>
                  ) : (
                    "Copy Message"
                  )}
                </button>
                <button
                  onClick={() => generate(messageType)}
                  className="text-sm px-4 py-2.5 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800 rounded-xl transition-colors font-medium"
                >
                  Regenerate
                </button>
                <button
                  onClick={() => generate(messageType === "outreach" ? "followup" : "outreach")}
                  className="text-sm px-4 py-2.5 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800 rounded-xl transition-colors font-medium"
                >
                  {messageType === "outreach" ? "Follow-up" : "Outreach"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
