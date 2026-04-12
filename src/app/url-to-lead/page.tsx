"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ExtractedData = {
  companyName: string;
  website: string;
  instagramHandle: string;
  niche: string;
  notes: string;
  brandScore: number;
  contentScore: number;
  revenueScore: number;
  contactUrl: string;
  aboutUrl: string;
  premiumSignals: string[];
};

type Stage = "input" | "loading" | "review" | "saving";

function ScoreSlider({
  name,
  label,
  value,
  onChange,
}: {
  name: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  let color = "text-emerald-400";
  if (value <= 4) color = "text-red-400";
  else if (value <= 6) color = "text-amber-400";

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-medium text-zinc-400">{label}</label>
        <span className={`text-xs font-semibold tabular-nums ${color}`}>
          {value}/10
        </span>
      </div>
      <input
        type="range"
        name={name}
        min="1"
        max="10"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-indigo-500 h-1.5"
      />
    </div>
  );
}

export default function URLToLeadPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [stage, setStage] = useState<Stage>("input");
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");

  // Editable form fields
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [niche, setNiche] = useState("");
  const [notes, setNotes] = useState("");
  const [brandScore, setBrandScore] = useState(5);
  const [contentScore, setContentScore] = useState(5);
  const [revenueScore, setRevenueScore] = useState(5);

  // Extra extracted info (read-only display)
  const [contactUrl, setContactUrl] = useState("");
  const [aboutUrl, setAboutUrl] = useState("");
  const [premiumSignals, setPremiumSignals] = useState<string[]>([]);

  async function handleExtract(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setStage("loading");
    setError("");

    try {
      const res = await fetch("/api/leads/from-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to extract data.");
        setStage("input");
        return;
      }

      const d: ExtractedData = data.extracted;
      setCompanyName(d.companyName);
      setWebsite(d.website);
      setInstagramHandle(d.instagramHandle);
      setNiche(d.niche);
      setNotes(d.notes);
      setBrandScore(d.brandScore);
      setContentScore(d.contentScore);
      setRevenueScore(d.revenueScore);
      setContactUrl(d.contactUrl);
      setAboutUrl(d.aboutUrl);
      setPremiumSignals(d.premiumSignals);
      setStage("review");
    } catch {
      setError("Network error. Check the URL and try again.");
      setStage("input");
    }
  }

  async function handleSave() {
    if (!companyName.trim() || !niche.trim() || !instagramHandle.trim()) {
      setSaveError("Company name, niche, and Instagram handle are required.");
      return;
    }

    setStage("saving");
    setSaveError("");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim(),
          niche: niche.trim(),
          instagramHandle: instagramHandle.trim(),
          website: website.trim(),
          brandScore,
          contentScore,
          revenueScore,
          status: "new",
          notes: notes.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.error || "Failed to save lead.");
        setStage("review");
        return;
      }

      router.push("/");
    } catch {
      setSaveError("Network error. Try again.");
      setStage("review");
    }
  }

  function handleReset() {
    setUrl("");
    setStage("input");
    setError("");
    setSaveError("");
  }

  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-10 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8 sm:mb-10">
        <a
          href="/"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </a>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            URL to Lead
          </h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            Paste a website URL to auto-generate a lead.
          </p>
        </div>
      </div>

      {/* ── URL input stage ──────────────────────── */}
      {stage === "input" && (
        <div className="animate-fade-in">
          {error && (
            <div className="mb-5 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 animate-scale-in">
              {error}
            </div>
          )}

          <form onSubmit={handleExtract} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Website URL
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                autoFocus
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={!url.trim()}
              className="w-full sm:w-auto text-sm px-6 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Extract Lead Data
            </button>
          </form>

          <div className="mt-8 bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-5 text-xs text-zinc-500 space-y-1.5">
            <p className="text-zinc-400 font-medium">What this does:</p>
            <p>Fetches the website&apos;s public HTML and extracts company name, Instagram, niche, and scoring signals.</p>
            <p>You&apos;ll review and edit everything before saving.</p>
          </div>
        </div>
      )}

      {/* ── Loading stage ────────────────────────── */}
      {stage === "loading" && (
        <div className="text-center py-16 animate-fade-in">
          <div className="inline-block w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm text-zinc-400">Analyzing website...</p>
          <p className="text-xs text-zinc-600 mt-1">{url}</p>
        </div>
      )}

      {/* ── Review stage ─────────────────────────── */}
      {(stage === "review" || stage === "saving") && (
        <div className="animate-slide-up space-y-6">
          {/* Premium signals */}
          {premiumSignals.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {premiumSignals.map((signal) => (
                <span
                  key={signal}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-400/80 border border-orange-500/15"
                >
                  {signal}
                </span>
              ))}
            </div>
          )}

          {/* Detected links */}
          {(contactUrl || aboutUrl) && (
            <div className="flex flex-wrap gap-3 text-xs">
              {aboutUrl && (
                <a href={aboutUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                  About page &rarr;
                </a>
              )}
              {contactUrl && (
                <a href={contactUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                  Contact page &rarr;
                </a>
              )}
            </div>
          )}

          {saveError && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 animate-scale-in">
              {saveError}
            </div>
          )}

          {/* Editable form */}
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Company Name *
                </label>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-2.5 text-sm text-zinc-100 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Niche *
                </label>
                <input
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-2.5 text-sm text-zinc-100 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Instagram *
                </label>
                <input
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value)}
                  placeholder="@handle"
                  className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Website
                </label>
                <input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-2.5 text-sm text-zinc-100 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <ScoreSlider name="brandScore" label="Brand" value={brandScore} onChange={setBrandScore} />
              <ScoreSlider name="contentScore" label="Content" value={contentScore} onChange={setContentScore} />
              <ScoreSlider name="revenueScore" label="Revenue" value={revenueScore} onChange={setRevenueScore} />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-2.5 text-sm text-zinc-100 resize-none transition-colors"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button
              onClick={handleReset}
              disabled={stage === "saving"}
              className="text-sm px-4 py-2.5 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-900 rounded-xl transition-colors"
            >
              Start over
            </button>
            <button
              onClick={handleSave}
              disabled={stage === "saving"}
              className="text-sm px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {stage === "saving" && (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {stage === "saving" ? "Saving..." : "Save Lead"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
