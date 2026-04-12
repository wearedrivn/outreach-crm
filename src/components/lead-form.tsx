"use client";

import { useState } from "react";
import type { Lead } from "@prisma/client";

type Props = {
  lead: Lead | null;
  onClose: () => void;
};

function ScoreSlider({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: number;
}) {
  const [value, setValue] = useState(defaultValue);
  let color = "text-emerald-400";
  if (value <= 4) color = "text-red-400";
  else if (value <= 6) color = "text-amber-400";

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-medium text-zinc-400">{label}</label>
        <span className={`text-xs font-semibold tabular-nums ${color}`}>{value}/10</span>
      </div>
      <input
        type="range"
        name={name}
        min="1"
        max="10"
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full accent-indigo-500 h-1.5"
      />
    </div>
  );
}

export function LeadForm({ lead, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const data = {
      companyName: form.get("companyName") as string,
      niche: form.get("niche") as string,
      instagramHandle: form.get("instagramHandle") as string,
      website: form.get("website") as string,
      brandScore: Number(form.get("brandScore")),
      contentScore: Number(form.get("contentScore")),
      revenueScore: Number(form.get("revenueScore")),
      notes: form.get("notes") as string,
    };

    if (!data.companyName || !data.niche || !data.instagramHandle) {
      setError("Company name, niche, and Instagram handle are required.");
      setLoading(false);
      return;
    }

    const url = lead ? `/api/leads/${lead.id}` : "/api/leads";
    const method = lead ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      setError("Failed to save lead. Try again.");
      setLoading(false);
      return;
    }

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm overlay-backdrop p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl shadow-black/40 animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 pb-0">
          <h2 className="text-lg font-semibold tracking-tight">
            {lead ? "Edit Lead" : "New Lead"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 animate-scale-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Company Name *</label>
              <input
                name="companyName"
                defaultValue={lead?.companyName || ""}
                placeholder="Acme Inc."
                className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Niche *</label>
              <input
                name="niche"
                defaultValue={lead?.niche || ""}
                placeholder="e.g. Fitness, SaaS"
                className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Instagram *</label>
              <input
                name="instagramHandle"
                defaultValue={lead?.instagramHandle || ""}
                placeholder="@handle"
                className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Website</label>
              <input
                name="website"
                defaultValue={lead?.website || ""}
                placeholder="https://..."
                className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <ScoreSlider name="brandScore" label="Brand" defaultValue={lead?.brandScore ?? 5} />
            <ScoreSlider name="contentScore" label="Content" defaultValue={lead?.contentScore ?? 5} />
            <ScoreSlider name="revenueScore" label="Revenue" defaultValue={lead?.revenueScore ?? 5} />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Notes</label>
            <textarea
              name="notes"
              rows={3}
              defaultValue={lead?.notes || ""}
              placeholder="Any context about this lead..."
              className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 resize-none transition-colors"
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="text-sm px-4 py-2.5 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="text-sm px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-500 active:bg-indigo-700 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && (
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {loading ? "Saving..." : lead ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
