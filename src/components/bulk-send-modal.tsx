"use client";

import { useState } from "react";

type SendResult = {
  leadId: string;
  companyName: string;
  status: "sent" | "skipped" | "failed";
  reason?: string;
};

type Props = {
  selectedCount: number;
  onClose: () => void;
  onSend: (opts: { skipContacted: boolean; startSequence: boolean }) => Promise<{
    results: SendResult[];
    summary: { sent: number; skipped: number; failed: number; total: number };
  }>;
  onDone: () => void;
};

export function BulkSendModal({ selectedCount, onClose, onSend, onDone }: Props) {
  const [skipContacted, setSkipContacted] = useState(false);
  const [startSequence, setStartSequence] = useState(true);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<SendResult[] | null>(null);
  const [summary, setSummary] = useState<{ sent: number; skipped: number; failed: number; total: number } | null>(null);
  const [error, setError] = useState("");

  async function handleSend() {
    setSending(true);
    setError("");
    try {
      const data = await onSend({ skipContacted, startSequence });
      setResults(data.results);
      setSummary(data.summary);
    } catch {
      setError("Bulk send failed. Please try again.");
    }
    setSending(false);
  }

  function handleDone() {
    onDone();
    onClose();
  }

  const statusIcon = (status: string) => {
    if (status === "sent") return <span className="text-emerald-400">&#10003;</span>;
    if (status === "skipped") return <span className="text-amber-400">&#8212;</span>;
    return <span className="text-red-400">&#10007;</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm overlay-backdrop p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl shadow-black/40 animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-lg font-semibold tracking-tight">
            {results ? "Bulk Send Results" : "Bulk Send Email"}
          </h2>
          <button
            onClick={results ? handleDone : onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="border-t border-zinc-800/60" />

        <div className="p-6">
          {error && (
            <div className="mb-5 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* Pre-send options */}
          {!results && !sending && (
            <div className="space-y-5">
              <p className="text-sm text-zinc-400">
                Send personalized outreach emails to <span className="text-zinc-100 font-medium">{selectedCount} selected leads</span>.
                Messages will be auto-generated per lead.
              </p>

              <div className="space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={skipContacted}
                    onChange={(e) => setSkipContacted(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 accent-indigo-500"
                  />
                  <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
                    Skip already contacted leads
                  </span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={startSequence}
                    onChange={(e) => setStartSequence(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 accent-indigo-500"
                  />
                  <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
                    Start follow-up sequence (day 3 + day 7)
                  </span>
                </label>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-xs text-amber-400">
                Leads without email, unsubscribed, or with status replied/booked/closed will be skipped automatically.
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="text-sm px-4 py-2.5 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  className="text-sm px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-500 active:bg-indigo-700 transition-all duration-150"
                >
                  Send to {selectedCount} leads
                </button>
              </div>
            </div>
          )}

          {/* Sending state */}
          {sending && (
            <div className="text-center py-10">
              <span className="inline-block w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
              <p className="text-sm text-zinc-400">Sending emails to {selectedCount} leads...</p>
              <p className="text-xs text-zinc-600 mt-1">This may take a moment</p>
            </div>
          )}

          {/* Results */}
          {results && summary && (
            <div className="space-y-5">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-center">
                  <div className="text-2xl font-bold text-emerald-400 tabular-nums">{summary.sent}</div>
                  <div className="text-[11px] text-emerald-400/70 uppercase tracking-wider font-medium">Sent</div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-center">
                  <div className="text-2xl font-bold text-amber-400 tabular-nums">{summary.skipped}</div>
                  <div className="text-[11px] text-amber-400/70 uppercase tracking-wider font-medium">Skipped</div>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-center">
                  <div className="text-2xl font-bold text-red-400 tabular-nums">{summary.failed}</div>
                  <div className="text-[11px] text-red-400/70 uppercase tracking-wider font-medium">Failed</div>
                </div>
              </div>

              {/* Per-lead results */}
              <div className="max-h-60 overflow-y-auto space-y-1.5">
                {results.map((r) => (
                  <div key={r.leadId} className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-zinc-800/30">
                    <div className="flex items-center gap-2 min-w-0">
                      {statusIcon(r.status)}
                      <span className="text-zinc-300 truncate">{r.companyName}</span>
                    </div>
                    {r.reason && <span className="text-zinc-600 shrink-0 ml-2">{r.reason}</span>}
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleDone}
                  className="text-sm px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-500 transition-all duration-150"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
