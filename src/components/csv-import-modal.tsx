"use client";

import { useState, useRef } from "react";

type ImportResult = {
  imported: number;
  skipped: number;
  errors: { row: number; message: string }[];
};

type Props = {
  onClose: () => void;
  onImported: () => void;
};

type Stage = "pick" | "uploading" | "done" | "error";

export function CSVImportModal({ onClose, onImported }: Props) {
  const [stage, setStage] = useState<Stage>("pick");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File | null | undefined) {
    if (!f) return;
    if (!f.name.endsWith(".csv") && f.type !== "text/csv") {
      setErrorMsg("Please upload a .csv file.");
      setStage("error");
      return;
    }
    setFile(f);
    setErrorMsg("");
  }

  async function handleUpload() {
    if (!file) return;
    setStage("uploading");
    setErrorMsg("");

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/leads/import", {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Import failed.");
        if (data.errors?.length) {
          setResult({ imported: 0, skipped: data.errors.length, errors: data.errors });
        }
        setStage("error");
        return;
      }

      setResult(data);
      setStage("done");
      onImported();
    } catch {
      setErrorMsg("Network error. Try again.");
      setStage("error");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }

  function reset() {
    setFile(null);
    setResult(null);
    setErrorMsg("");
    setStage("pick");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm overlay-backdrop p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl shadow-black/40 animate-scale-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-0">
          <h2 className="text-lg font-semibold tracking-tight">Import Leads</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* ── File picker stage ──────────────────── */}
          {(stage === "pick" || stage === "error") && (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  dragOver
                    ? "border-indigo-500 bg-indigo-500/5"
                    : file
                      ? "border-zinc-700 bg-zinc-800/30"
                      : "border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
                {file ? (
                  <div className="animate-fade-in">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/10 mb-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-indigo-400">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                        <polyline points="14 2 14 8 20 8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p className="text-sm text-zinc-200 font-medium">{file.name}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {(file.size / 1024).toFixed(1)} KB — click to change
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-800 mb-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-500">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
                        <polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" />
                      </svg>
                    </div>
                    <p className="text-sm text-zinc-400">
                      Drop a CSV file here or <span className="text-indigo-400">browse</span>
                    </p>
                    <p className="text-xs text-zinc-600 mt-1">Max 2MB</p>
                  </div>
                )}
              </div>

              {/* Format hint */}
              <div className="bg-zinc-800/30 rounded-xl p-4 text-xs text-zinc-500 space-y-1.5">
                <p className="text-zinc-400 font-medium">Required columns:</p>
                <p className="font-mono">companyName, niche, instagramHandle</p>
                <p className="text-zinc-400 font-medium mt-2">Optional columns:</p>
                <p className="font-mono">website, brandScore, contentScore, revenueScore, status, notes</p>
              </div>

              {/* Error display */}
              {errorMsg && (
                <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 animate-scale-in">
                  {errorMsg}
                </div>
              )}

              {/* Row-level errors from failed import */}
              {result && result.errors.length > 0 && (
                <div className="bg-zinc-800/30 rounded-xl p-4 text-xs max-h-32 overflow-y-auto space-y-1">
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-red-400/80">
                      Row {err.row}: {err.message}
                    </p>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-1">
                <button
                  onClick={onClose}
                  className="text-sm px-4 py-2.5 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!file}
                  className="text-sm px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-500 active:bg-indigo-700 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Import
                </button>
              </div>
            </>
          )}

          {/* ── Uploading stage ───────────────────── */}
          {stage === "uploading" && (
            <div className="text-center py-10 animate-fade-in">
              <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-zinc-400">Importing leads...</p>
            </div>
          )}

          {/* ── Done stage ────────────────────────── */}
          {stage === "done" && result && (
            <div className="animate-fade-in space-y-5">
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="text-zinc-100 font-medium">
                  {result.imported} lead{result.imported !== 1 ? "s" : ""} imported
                </p>
                {result.skipped > 0 && (
                  <p className="text-xs text-zinc-500 mt-1">
                    {result.skipped} row{result.skipped !== 1 ? "s" : ""} skipped
                  </p>
                )}
              </div>

              {result.errors.length > 0 && (
                <div className="bg-zinc-800/30 rounded-xl p-4 text-xs max-h-32 overflow-y-auto space-y-1">
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-amber-400/80">
                      Row {err.row}: {err.message}
                    </p>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={reset}
                  className="text-sm px-4 py-2.5 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  Import more
                </button>
                <button
                  onClick={onClose}
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
