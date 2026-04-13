"use client";

import { useState, useRef, useCallback } from "react";
import { parseCSV } from "@/lib/csv";
import type { ExtractedLead } from "@/lib/url-extract";

/* ── Types ──────────────────────────────────────────── */

type RowStatus = "pending" | "processing" | "success" | "duplicate" | "failed" | "saved" | "skipped";

type ImportRow = {
  id: string;
  url: string;
  status: RowStatus;
  error?: string;
  duplicateOf?: string;
  data?: ExtractedLead;
  selected: boolean;
  editing: boolean;
};

const BATCH_SIZE = 3;

/* ── Main Component ─────────────────────────────────── */

export function BulkImport() {
  const [inputMode, setInputMode] = useState<"paste" | "csv">("paste");
  const [urlText, setUrlText] = useState("");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);

  /* ── URL parsing ─────────────────────────────────── */

  function parseURLsFromText(text: string): string[] {
    return text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("#"));
  }

  function parseURLsFromCSV(csvText: string): string[] {
    const parsed = parseCSV(csvText);
    const urls: string[] = [];
    for (const row of parsed) {
      const val =
        row["website"] || row["url"] || row["site"] || row["domain"] ||
        row["Website"] || row["URL"] || row["Site"] || row["Domain"] ||
        Object.values(row).find((v) => v.match(/^https?:\/\//) || v.match(/^www\./));
      if (val) urls.push(val.trim());
    }
    return urls;
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const urls = parseURLsFromCSV(text);
      if (urls.length === 0) {
        alert("No URLs found in CSV. Make sure there's a 'website', 'url', or 'domain' column.");
        return;
      }
      initRows(urls);
    };
    reader.readAsText(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  }

  function initRows(urls: string[]) {
    // Deduplicate URLs
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const u of urls) {
      const key = u.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(u);
      }
    }

    setRows(
      unique.map((url, i) => ({
        id: `row-${i}-${Date.now()}`,
        url,
        status: "pending",
        selected: false,
        editing: false,
      })),
    );
    setSavedCount(0);
  }

  function handleStartPaste() {
    const urls = parseURLsFromText(urlText);
    if (urls.length === 0) return;
    initRows(urls);
  }

  /* ── Batch processing ────────────────────────────── */

  const processAll = useCallback(async () => {
    setProcessing(true);
    abortRef.current = false;

    // Get only pending/failed rows
    const toProcess = rows.filter((r) => r.status === "pending" || r.status === "failed");
    const batches: ImportRow[][] = [];
    for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
      batches.push(toProcess.slice(i, i + BATCH_SIZE));
    }

    for (const batch of batches) {
      if (abortRef.current) break;

      // Mark batch as processing
      setRows((prev) =>
        prev.map((r) =>
          batch.some((b) => b.id === r.id) ? { ...r, status: "processing" as RowStatus } : r,
        ),
      );

      try {
        const res = await fetch("/api/leads/from-url-batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urls: batch.map((b) => b.url) }),
        });

        if (!res.ok) {
          // Mark whole batch as failed
          setRows((prev) =>
            prev.map((r) =>
              batch.some((b) => b.id === r.id)
                ? { ...r, status: "failed" as RowStatus, error: `API error ${res.status}` }
                : r,
            ),
          );
          continue;
        }

        const { results } = await res.json();

        setRows((prev) =>
          prev.map((r) => {
            const match = results.find(
              (res: { url: string }) => res.url === r.url && batch.some((b) => b.id === r.id),
            );
            if (!match) return r;

            return {
              ...r,
              status: match.status as RowStatus,
              data: match.data || r.data,
              error: match.error,
              duplicateOf: match.duplicateOf,
              selected: match.status === "success",
            };
          }),
        );
      } catch (err) {
        setRows((prev) =>
          prev.map((r) =>
            batch.some((b) => b.id === r.id)
              ? { ...r, status: "failed" as RowStatus, error: (err as Error).message }
              : r,
          ),
        );
      }
    }

    setProcessing(false);
  }, [rows]);

  function retryFailed() {
    setRows((prev) =>
      prev.map((r) => (r.status === "failed" ? { ...r, status: "pending" as RowStatus, error: undefined } : r)),
    );
    // Will trigger processAll via the button
  }

  /* ── Selection helpers ───────────────────────────── */

  const successRows = rows.filter((r) => r.status === "success" && r.data);
  const selectedCount = rows.filter((r) => r.selected).length;
  const failedCount = rows.filter((r) => r.status === "failed").length;
  const duplicateCount = rows.filter((r) => r.status === "duplicate").length;
  const processedCount = rows.filter((r) => r.status !== "pending" && r.status !== "processing").length;

  function toggleAll(checked: boolean) {
    setRows((prev) =>
      prev.map((r) => (r.status === "success" && r.data ? { ...r, selected: checked } : r)),
    );
  }

  function toggleRow(id: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r)));
  }

  function selectHighOpp() {
    setRows((prev) =>
      prev.map((r) => {
        if (r.status !== "success" || !r.data) return r;
        const d = r.data;
        const isHigh = d.brandScore >= 7 && d.contentScore <= 5 && d.revenueScore >= 7;
        return { ...r, selected: isHigh };
      }),
    );
  }

  /* ── Inline editing ──────────────────────────────── */

  function updateRowData(id: string, field: keyof ExtractedLead, value: string | number) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id || !r.data) return r;
        return { ...r, data: { ...r.data, [field]: value } };
      }),
    );
  }

  /* ── Save selected ───────────────────────────────── */

  async function saveSelected() {
    const toSave = rows.filter((r) => r.selected && r.data);
    if (toSave.length === 0) return;

    setSaving(true);
    let saved = 0;

    for (const row of toSave) {
      if (!row.data) continue;

      try {
        const res = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName: row.data.companyName,
            niche: row.data.niche,
            instagramHandle: row.data.instagramHandle,
            website: row.data.website,
            brandScore: row.data.brandScore,
            contentScore: row.data.contentScore,
            revenueScore: row.data.revenueScore,
            status: "new",
            notes: row.data.notes,
          }),
        });

        if (res.ok) {
          saved++;
          setRows((prev) =>
            prev.map((r) => (r.id === row.id ? { ...r, status: "saved" as RowStatus, selected: false } : r)),
          );
        } else {
          setRows((prev) =>
            prev.map((r) =>
              r.id === row.id ? { ...r, status: "failed" as RowStatus, error: "Save failed" } : r,
            ),
          );
        }
      } catch {
        setRows((prev) =>
          prev.map((r) =>
            r.id === row.id ? { ...r, status: "failed" as RowStatus, error: "Network error" } : r,
          ),
        );
      }
    }

    setSavedCount((prev) => prev + saved);
    setSaving(false);
  }

  /* ── Status badge ────────────────────────────────── */

  function StatusBadge({ status, error, duplicateOf }: { status: RowStatus; error?: string; duplicateOf?: string }) {
    const styles: Record<RowStatus, string> = {
      pending: "bg-zinc-800 text-zinc-500",
      processing: "bg-indigo-500/15 text-indigo-400",
      success: "bg-emerald-500/15 text-emerald-400",
      duplicate: "bg-amber-500/15 text-amber-400",
      failed: "bg-red-500/15 text-red-400",
      saved: "bg-green-500/15 text-green-300",
      skipped: "bg-zinc-800 text-zinc-500",
    };

    const labels: Record<RowStatus, string> = {
      pending: "Pending",
      processing: "Processing...",
      success: "Ready",
      duplicate: `Duplicate${duplicateOf ? ` of ${duplicateOf}` : ""}`,
      failed: error || "Failed",
      saved: "Saved",
      skipped: "Skipped",
    };

    return (
      <span
        className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-lg whitespace-nowrap max-w-[180px] truncate ${styles[status]}`}
        title={labels[status]}
      >
        {status === "processing" && (
          <span className="inline-block w-3 h-3 border border-indigo-400 border-t-transparent rounded-full animate-spin mr-1 align-middle" />
        )}
        {labels[status]}
      </span>
    );
  }

  /* ── Progress bar ────────────────────────────────── */

  const totalRows = rows.length;
  const progress = totalRows > 0 ? (processedCount / totalRows) * 100 : 0;

  /* ── Render ──────────────────────────────────────── */

  // Phase 1: Input
  if (rows.length === 0) {
    return (
      <div className="animate-slide-up max-w-3xl mx-auto">
        {/* Mode toggle */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setInputMode("paste")}
            className={`text-sm px-4 py-2 rounded-xl font-medium transition-all ${
              inputMode === "paste"
                ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/25"
                : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700"
            }`}
          >
            Paste URLs
          </button>
          <button
            onClick={() => setInputMode("csv")}
            className={`text-sm px-4 py-2 rounded-xl font-medium transition-all ${
              inputMode === "csv"
                ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/25"
                : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700"
            }`}
          >
            Upload CSV
          </button>
        </div>

        {inputMode === "paste" ? (
          <div className="space-y-4">
            <textarea
              value={urlText}
              onChange={(e) => setUrlText(e.target.value)}
              placeholder={"https://example.com\nhttps://another-brand.com\nhttps://agency-site.io\n\nOne URL per line. Lines starting with # are ignored."}
              rows={12}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 font-mono resize-none focus:outline-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">
                {parseURLsFromText(urlText).length} URL{parseURLsFromText(urlText).length !== 1 ? "s" : ""} detected
              </span>
              <button
                onClick={handleStartPaste}
                disabled={parseURLsFromText(urlText).length === 0}
                className="text-sm px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-medium rounded-xl transition-all"
              >
                Continue
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 rounded-2xl p-12 text-center cursor-pointer transition-colors"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 text-zinc-600">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p className="text-sm text-zinc-400 font-medium">Click to upload a CSV file</p>
              <p className="text-xs text-zinc-600 mt-1">Must contain a website, url, or domain column</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}
      </div>
    );
  }

  // Phase 2: Processing + Review
  return (
    <div className="animate-slide-up space-y-5">
      {/* Progress header */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-zinc-300">
            {processing
              ? `Processing URLs... (${processedCount}/${totalRows})`
              : savedCount > 0
                ? `${savedCount} lead${savedCount !== 1 ? "s" : ""} saved to CRM`
                : `${totalRows} URL${totalRows !== 1 ? "s" : ""} ready`}
          </p>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            {successRows.length > 0 && <span className="text-emerald-400">{successRows.length} ready</span>}
            {duplicateCount > 0 && <span className="text-amber-400">{duplicateCount} duplicate{duplicateCount !== 1 ? "s" : ""}</span>}
            {failedCount > 0 && <span className="text-red-400">{failedCount} failed</span>}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-4">
          {!processing && processedCount < totalRows && (
            <button
              onClick={processAll}
              className="text-sm px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all"
            >
              Process URLs
            </button>
          )}

          {processing && (
            <button
              onClick={() => { abortRef.current = true; }}
              className="text-sm px-4 py-2 bg-zinc-800 text-zinc-300 border border-zinc-700 font-medium rounded-xl hover:bg-zinc-700 transition-all"
            >
              Stop
            </button>
          )}

          {!processing && failedCount > 0 && (
            <button
              onClick={() => { retryFailed(); setTimeout(processAll, 100); }}
              className="text-sm px-4 py-2 bg-zinc-900 text-zinc-300 border border-zinc-800 font-medium rounded-xl hover:border-zinc-700 transition-all"
            >
              Retry Failed ({failedCount})
            </button>
          )}

          {!processing && selectedCount > 0 && (
            <button
              onClick={saveSelected}
              disabled={saving}
              className="text-sm px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-medium rounded-xl transition-all"
            >
              {saving ? "Saving..." : `Save ${selectedCount} Lead${selectedCount !== 1 ? "s" : ""}`}
            </button>
          )}

          {!processing && successRows.length > 0 && (
            <>
              <button
                onClick={selectHighOpp}
                className="text-sm px-3 py-2 bg-orange-500/10 text-orange-400 border border-orange-500/20 font-medium rounded-xl hover:bg-orange-500/20 transition-all"
              >
                Select High Opp
              </button>
              <button
                onClick={() => toggleAll(true)}
                className="text-xs px-3 py-2 text-zinc-400 hover:text-zinc-300 transition-colors"
              >
                Select all
              </button>
              <button
                onClick={() => toggleAll(false)}
                className="text-xs px-3 py-2 text-zinc-400 hover:text-zinc-300 transition-colors"
              >
                Deselect all
              </button>
            </>
          )}

          <button
            onClick={() => { setRows([]); setSavedCount(0); }}
            className="text-xs px-3 py-2 text-zinc-500 hover:text-zinc-300 transition-colors ml-auto"
          >
            Start over
          </button>
        </div>
      </div>

      {/* Results table */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-800/80 bg-zinc-900/30">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800/80">
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={successRows.length > 0 && successRows.every((r) => r.selected)}
                  onChange={(e) => toggleAll(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 accent-indigo-500"
                />
              </th>
              <th className="text-left px-3 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">URL</th>
              <th className="text-left px-3 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Company</th>
              <th className="text-left px-3 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Niche</th>
              <th className="text-left px-3 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Instagram</th>
              <th className="text-center px-3 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">B/C/R</th>
              <th className="text-center px-3 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {rows.map((row) => (
              <tr
                key={row.id}
                className={`transition-colors ${
                  row.status === "saved" ? "opacity-50" :
                  row.selected ? "bg-indigo-500/5" :
                  "hover:bg-zinc-800/30"
                }`}
              >
                <td className="px-3 py-3 text-center">
                  {row.status === "success" && (
                    <input
                      type="checkbox"
                      checked={row.selected}
                      onChange={() => toggleRow(row.id)}
                      className="rounded border-zinc-700 bg-zinc-900 accent-indigo-500"
                    />
                  )}
                </td>
                <td className="px-3 py-3">
                  <span className="text-xs text-zinc-500 font-mono truncate block max-w-[200px]" title={row.url}>
                    {row.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </span>
                </td>
                <td className="px-3 py-3">
                  {row.data && row.status === "success" && row.editing ? (
                    <input
                      value={row.data.companyName}
                      onChange={(e) => updateRowData(row.id, "companyName", e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-200 w-36"
                    />
                  ) : (
                    <span className="text-zinc-200 text-sm">
                      {row.data?.companyName || "--"}
                    </span>
                  )}
                </td>
                <td className="px-3 py-3">
                  {row.data && row.status === "success" && row.editing ? (
                    <input
                      value={row.data.niche}
                      onChange={(e) => updateRowData(row.id, "niche", e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-200 w-28"
                    />
                  ) : (
                    <span className="text-zinc-400 text-sm">
                      {row.data?.niche || "--"}
                    </span>
                  )}
                </td>
                <td className="px-3 py-3">
                  {row.data && row.status === "success" && row.editing ? (
                    <input
                      value={row.data.instagramHandle}
                      onChange={(e) => updateRowData(row.id, "instagramHandle", e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-200 w-28 font-mono"
                    />
                  ) : (
                    <span className="text-indigo-400 text-xs font-mono">
                      {row.data?.instagramHandle || "--"}
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 text-center">
                  {row.data ? (
                    row.status === "success" && row.editing ? (
                      <div className="flex items-center gap-1 justify-center">
                        <input
                          type="number" min={1} max={10}
                          value={row.data.brandScore}
                          onChange={(e) => updateRowData(row.id, "brandScore", parseInt(e.target.value) || 5)}
                          className="bg-zinc-800 border border-zinc-700 rounded px-1 py-0.5 text-xs text-zinc-200 w-10 text-center"
                        />
                        <span className="text-zinc-600">/</span>
                        <input
                          type="number" min={1} max={10}
                          value={row.data.contentScore}
                          onChange={(e) => updateRowData(row.id, "contentScore", parseInt(e.target.value) || 5)}
                          className="bg-zinc-800 border border-zinc-700 rounded px-1 py-0.5 text-xs text-zinc-200 w-10 text-center"
                        />
                        <span className="text-zinc-600">/</span>
                        <input
                          type="number" min={1} max={10}
                          value={row.data.revenueScore}
                          onChange={(e) => updateRowData(row.id, "revenueScore", parseInt(e.target.value) || 5)}
                          className="bg-zinc-800 border border-zinc-700 rounded px-1 py-0.5 text-xs text-zinc-200 w-10 text-center"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-400 tabular-nums">
                        {row.data.brandScore}/{row.data.contentScore}/{row.data.revenueScore}
                      </span>
                    )
                  ) : (
                    <span className="text-zinc-700">--</span>
                  )}
                </td>
                <td className="px-3 py-3 text-center">
                  <StatusBadge status={row.status} error={row.error} duplicateOf={row.duplicateOf} />
                </td>
                <td className="px-3 py-2">
                  {row.status === "success" && (
                    <button
                      onClick={() =>
                        setRows((prev) =>
                          prev.map((r) => (r.id === row.id ? { ...r, editing: !r.editing } : r)),
                        )
                      }
                      className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-1"
                      title={row.editing ? "Done editing" : "Edit"}
                    >
                      {row.editing ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      )}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
