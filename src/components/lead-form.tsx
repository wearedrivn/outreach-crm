"use client";

import { useState } from "react";
import type { Lead } from "@/generated/prisma/client";

type Props = {
  lead: Lead | null;
  onClose: () => void;
};

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">
            {lead ? "Edit Lead" : "New Lead"}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Company Name *</label>
              <input
                name="companyName"
                defaultValue={lead?.companyName || ""}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Niche *</label>
              <input
                name="niche"
                defaultValue={lead?.niche || ""}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Instagram *</label>
              <input
                name="instagramHandle"
                defaultValue={lead?.instagramHandle || ""}
                placeholder="@handle"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Website</label>
              <input
                name="website"
                defaultValue={lead?.website || ""}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">
                Brand Score ({lead?.brandScore ?? 5})
              </label>
              <input
                type="range"
                name="brandScore"
                min="1"
                max="10"
                defaultValue={lead?.brandScore ?? 5}
                className="w-full accent-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">
                Content Score ({lead?.contentScore ?? 5})
              </label>
              <input
                type="range"
                name="contentScore"
                min="1"
                max="10"
                defaultValue={lead?.contentScore ?? 5}
                className="w-full accent-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">
                Revenue Score ({lead?.revenueScore ?? 5})
              </label>
              <input
                type="range"
                name="revenueScore"
                min="1"
                max="10"
                defaultValue={lead?.revenueScore ?? 5}
                className="w-full accent-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">Notes</label>
            <textarea
              name="notes"
              rows={3}
              defaultValue={lead?.notes || ""}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm px-4 py-2 bg-zinc-800 text-zinc-400 rounded-lg hover:bg-zinc-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="text-sm px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? "Saving..." : lead ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
