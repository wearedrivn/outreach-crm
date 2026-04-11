"use client";

import { useState } from "react";
import type { Lead } from "@prisma/client";

type Props = {
  lead: Lead;
  onClose: () => void;
};

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">{lead.companyName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-zinc-500">{lead.niche}</span>
              <span className="text-xs text-indigo-400">{lead.instagramHandle}</span>
              {isHighOpp && (
                <span className="text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">
                  HIGH OPP
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            ✕
          </button>
        </div>

        <div className="flex items-center gap-4 mb-4 text-xs text-zinc-500">
          <span>Brand: <span className="text-zinc-300 font-medium">{lead.brandScore}/10</span></span>
          <span>Content: <span className="text-zinc-300 font-medium">{lead.contentScore}/10</span></span>
          <span>Revenue: <span className="text-zinc-300 font-medium">{lead.revenueScore}/10</span></span>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
            {error}
          </div>
        )}

        {!message && !loading && (
          <div className="text-center py-10">
            <p className="text-zinc-500 text-sm mb-6">Generate a personalized outreach message</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => generate("outreach")}
                className="text-sm px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
              >
                Generate Outreach
              </button>
              <button
                onClick={() => generate("followup")}
                className="text-sm px-5 py-2.5 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
              >
                Generate Follow-up
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-10">
            <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-500 text-sm mt-3">Generating message...</p>
          </div>
        )}

        {message && !loading && (
          <div>
            <div className="text-[11px] uppercase tracking-wider text-orange-400 font-semibold mb-2">
              {messageType === "outreach" ? "Initial Outreach" : "Follow-up"}
            </div>
            <div className="bg-zinc-800/50 border-l-3 border-indigo-500 rounded-lg p-4 text-sm leading-relaxed text-zinc-300 whitespace-pre-line">
              {message}
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleCopy}
                className="text-sm px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
              >
                {copied ? "Copied!" : "Copy Message"}
              </button>
              <button
                onClick={() => generate(messageType)}
                className="text-sm px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
              >
                Regenerate
              </button>
              <button
                onClick={() => generate(messageType === "outreach" ? "followup" : "outreach")}
                className="text-sm px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
              >
                {messageType === "outreach" ? "Generate Follow-up" : "Generate Outreach"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
