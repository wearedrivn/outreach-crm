"use client";

import { useState, useEffect, useCallback } from "react";
import type { Lead } from "@prisma/client";

type EmailLog = {
  id: string;
  subject: string;
  body: string;
  status: string;
  sequenceStep: number | null;
  sentAt: string;
};

type EmailSequence = {
  id: string;
  currentStep: number;
  startedAt: string;
  pausedAt: string | null;
  step1SentAt: string | null;
  step2DueAt: string | null;
  step2SentAt: string | null;
  step3DueAt: string | null;
  step3SentAt: string | null;
};

type MessageTemplate = {
  id: string;
  name: string;
  description: string;
  type: "outreach" | "followup";
  isDefault: boolean;
};

type Props = {
  lead: Lead;
  leads?: Lead[];
  onLeadChange?: (lead: Lead) => void;
  onClose: () => void;
  onRefresh?: () => void;
};

const ACTIONABLE_STATUSES = new Set(["new"]);

function isActionable(l: Lead): boolean {
  return Boolean(l.email) && !l.unsubscribed && ACTIONABLE_STATUSES.has(l.status);
}

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

type Tab = "compose" | "history";

export function MessageModal({ lead, leads, onLeadChange, onClose, onRefresh }: Props) {
  const [tab, setTab] = useState<Tab>("compose");
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [messageType, setMessageType] = useState<"outreach" | "followup">("outreach");
  const [source, setSource] = useState<"claude" | "template" | "user-template" | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [startSequence, setStartSequence] = useState(true);

  const [markingContacted, setMarkingContacted] = useState(false);
  const [markedContacted, setMarkedContacted] = useState(false);

  // Templates state
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  // Connection state
  const [hasConnection, setHasConnection] = useState<boolean | null>(null);

  // History state
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [sequence, setSequence] = useState<EmailSequence | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const hasEmail = Boolean(lead.email);
  const canSend = hasEmail && hasConnection === true;

  useEffect(() => {
    if (tab === "history") {
      loadHistory();
    }
  }, [tab]);

  // Reset per-lead state when the lead changes (navigation)
  useEffect(() => {
    setMessage("");
    setSubject("");
    setSource(null);
    setSent(false);
    setCopied(false);
    setMarkedContacted(false);
    setError("");
    setStartSequence(true);
    setMessageType("outreach");
    setSelectedTemplateId("");
    setTab("compose");
  }, [lead.id]);

  // Build actionable navigation queue from the leads list
  const actionableLeads = (leads ?? []).filter(
    (l) => isActionable(l) || l.id === lead.id,
  );
  const currentIndex = actionableLeads.findIndex((l) => l.id === lead.id);
  const prevLead =
    currentIndex > 0 ? actionableLeads[currentIndex - 1] : null;
  const nextLead =
    currentIndex >= 0 && currentIndex < actionableLeads.length - 1
      ? actionableLeads[currentIndex + 1]
      : null;

  const advanceTo = useCallback(
    async (target: Lead, autoMarkCurrent: boolean) => {
      if (autoMarkCurrent && lead.status === "new") {
        try {
          await fetch(`/api/leads/${lead.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: "contacted",
              lastContactedAt: new Date().toISOString(),
            }),
          });
          onRefresh?.();
        } catch {
          // non-fatal — still navigate
        }
      }
      onLeadChange?.(target);
    },
    [lead.id, lead.status, onLeadChange, onRefresh],
  );

  const goNext = useCallback(() => {
    if (nextLead) advanceTo(nextLead, true);
  }, [nextLead, advanceTo]);

  const goPrev = useCallback(() => {
    if (prevLead) advanceTo(prevLead, false);
  }, [prevLead, advanceTo]);

  // Keyboard shortcuts: ArrowRight = next, ArrowLeft = prev
  useEffect(() => {
    if (!leads) return;
    function handleKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [leads, goNext, goPrev]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/message-templates");
        const data = await res.json();
        if (Array.isArray(data)) setTemplates(data);
      } catch {
        // non-fatal — templates are optional
      }
    })();

    (async () => {
      try {
        const res = await fetch("/api/connections");
        const data = await res.json();
        const active = Array.isArray(data.connections)
          ? data.connections.some((c: { status: string }) => c.status === "active")
          : false;
        setHasConnection(active);
      } catch {
        setHasConnection(false);
      }
    })();
  }, []);

  async function handleMarkContacted() {
    setMarkingContacted(true);
    setError("");
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "contacted",
          lastContactedAt: new Date().toISOString(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to mark as contacted.");
        setMarkingContacted(false);
        return;
      }
      setMarkedContacted(true);
      onRefresh?.();
    } catch {
      setError("Network error.");
    }
    setMarkingContacted(false);
  }

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/email/history?leadId=${lead.id}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setSequence(data.sequence || null);
    } catch {
      // silent
    }
    setHistoryLoading(false);
  }

  async function generate(type: "outreach" | "followup", templateId?: string) {
    setLoading(true);
    setError("");
    setCopied(false);
    setSent(false);
    setMessageType(type);

    try {
      const res = await fetch("/api/generate-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          type,
          ...(templateId ? { templateId } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to generate message.");
        return;
      }

      setMessage(data.message);
      setSource(data.source || "template");
      setSubject(
        type === "outreach"
          ? `Quick thought on ${lead.companyName}`
          : `Following up — ${lead.companyName}`,
      );
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSendEmail() {
    if (!hasEmail || !message || !subject) return;

    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          subject,
          body: message,
          startSequence: startSequence && messageType === "outreach",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send email.");
        setSending(false);
        return;
      }

      setSent(true);
      onRefresh?.();
    } catch {
      setError("Failed to send. Try again.");
    }
    setSending(false);
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
              {hasEmail && (
                <span className="text-xs text-zinc-500">{lead.email}</span>
              )}
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
        <div className="flex items-center gap-5 px-6 pb-4 text-xs text-zinc-500">
          <span>Brand <span className="text-zinc-300 font-medium tabular-nums">{lead.brandScore}/10</span></span>
          <span>Content <span className="text-zinc-300 font-medium tabular-nums">{lead.contentScore}/10</span></span>
          <span>Revenue <span className="text-zinc-300 font-medium tabular-nums">{lead.revenueScore}/10</span></span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pb-4">
          <button
            onClick={() => setTab("compose")}
            className={`text-xs font-medium px-3.5 py-1.5 rounded-lg transition-colors ${
              tab === "compose"
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Compose
          </button>
          <button
            onClick={() => setTab("history")}
            className={`text-xs font-medium px-3.5 py-1.5 rounded-lg transition-colors ${
              tab === "history"
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Send History
          </button>
        </div>

        <div className="border-t border-zinc-800/60" />

        {/* Content area */}
        <div className="p-6">
          {error && (
            <div className="mb-5 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 animate-scale-in">
              {error}
            </div>
          )}

          {tab === "compose" && (
            <>
              {/* Initial state — generate buttons */}
              {!message && !loading && (
                <div className="py-2 animate-fade-in">
                  <p className="text-zinc-500 text-sm mb-5 text-center">
                    Generate a personalized outreach message for {lead.companyName}
                  </p>

                  {templates.length > 0 && (
                    <div className="mb-5">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">
                          Template
                        </label>
                        <a
                          href="/templates"
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          Manage →
                        </a>
                      </div>
                      <select
                        value={selectedTemplateId}
                        onChange={(e) => setSelectedTemplateId(e.target.value)}
                        className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2.5 text-sm text-zinc-100"
                      >
                        <option value="">AI-generated (no template)</option>
                        {templates.filter((t) => t.type === "outreach").length > 0 && (
                          <optgroup label="Outreach">
                            {templates
                              .filter((t) => t.type === "outreach")
                              .map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                </option>
                              ))}
                          </optgroup>
                        )}
                        {templates.filter((t) => t.type === "followup").length > 0 && (
                          <optgroup label="Follow-up">
                            {templates
                              .filter((t) => t.type === "followup")
                              .map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                </option>
                              ))}
                          </optgroup>
                        )}
                      </select>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <button
                      onClick={() => generate("outreach", selectedTemplateId || undefined)}
                      className="text-sm px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-500 active:bg-indigo-700 transition-all duration-150"
                    >
                      {selectedTemplateId ? "Use Template" : "Generate Outreach"}
                    </button>
                    {!selectedTemplateId && (
                      <button
                        onClick={() => generate("followup")}
                        className="text-sm px-5 py-2.5 bg-zinc-800 text-zinc-300 font-medium rounded-xl hover:bg-zinc-700 transition-colors"
                      >
                        Generate Follow-up
                      </button>
                    )}
                  </div>

                  {leads && (
                    <NavRow
                      prevLead={prevLead}
                      nextLead={nextLead}
                      currentIndex={currentIndex}
                      total={actionableLeads.length}
                      onPrev={goPrev}
                      onNext={goNext}
                    />
                  )}
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

                  {/* Subject line */}
                  <div className="mb-3">
                    <label className="block text-[11px] text-zinc-500 mb-1">Subject</label>
                    <input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-3 py-2 text-sm text-zinc-100 transition-colors"
                    />
                  </div>

                  {/* Message body — editable */}
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={8}
                    className="w-full bg-zinc-800/30 border border-zinc-800/60 border-l-2 border-l-indigo-500 rounded-xl p-5 text-sm leading-relaxed text-zinc-300 resize-none transition-colors"
                  />
                  {source && (
                    <p className="text-[11px] text-zinc-600 mt-1.5">
                      {source === "claude"
                        ? "Generated by Claude AI"
                        : source === "user-template"
                          ? "Rendered from your template"
                          : "Generated from templates"}
                    </p>
                  )}

                  {/* Sequence toggle */}
                  {canSend && messageType === "outreach" && !sent && (
                    <label className="flex items-center gap-2.5 mt-4 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={startSequence}
                        onChange={(e) => setStartSequence(e.target.checked)}
                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-indigo-500 accent-indigo-500"
                      />
                      <span className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors">
                        Start email sequence (follow-ups at day 3 and day 7)
                      </span>
                    </label>
                  )}

                  {/* Sent confirmation */}
                  {sent && (
                    <div className="mt-4 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 animate-scale-in flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Email sent to {lead.email}
                      {startSequence && messageType === "outreach" && " — sequence started"}
                    </div>
                  )}

                  {/* Marked contacted confirmation */}
                  {markedContacted && (
                    <div className="mt-4 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 animate-scale-in flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Lead marked as contacted
                    </div>
                  )}

                  {/* No-connection helper */}
                  {hasEmail && hasConnection === false && !sent && (
                    <div className="mt-4 text-xs text-zinc-400 bg-zinc-800/40 border border-zinc-800/80 rounded-xl px-4 py-3">
                      Connect your email to send directly from the app, or copy the message and send it manually.
                      <a
                        href="/connections"
                        className="ml-2 text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
                      >
                        Connect Email →
                      </a>
                    </div>
                  )}

                  {/* No-email helper */}
                  {!hasEmail && !sent && (
                    <div className="mt-4 text-xs text-zinc-400 bg-zinc-800/40 border border-zinc-800/80 rounded-xl px-4 py-3">
                      Add an email to this lead to enable sending, or copy the message and send it from your own inbox.
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2.5 mt-5">
                    {/* Send email button — enabled only with email + connection */}
                    {!sent && (
                      canSend ? (
                        <button
                          onClick={handleSendEmail}
                          disabled={sending || !subject || !message}
                          className="text-sm px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-500 active:bg-indigo-700 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {sending && (
                            <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          )}
                          {sending ? "Sending..." : "Send Email"}
                        </button>
                      ) : (
                        <button
                          disabled
                          title={
                            !hasEmail
                              ? "Add an email to this lead to enable sending."
                              : "Connect your email to send from the app."
                          }
                          className="text-sm px-4 py-2.5 bg-zinc-800 text-zinc-500 font-medium rounded-xl cursor-not-allowed opacity-60"
                        >
                          Send Email
                        </button>
                      )
                    )}

                    <button
                      onClick={handleCopy}
                      className={`text-sm px-4 py-2.5 font-medium rounded-xl transition-all duration-200 flex items-center gap-2 ${
                        copied
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                          : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
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

                    {/* Mark as contacted — manual fallback, always available */}
                    {!sent && lead.status !== "contacted" && (
                      <button
                        onClick={handleMarkContacted}
                        disabled={markingContacted || markedContacted}
                        className="text-sm px-4 py-2.5 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {markingContacted ? "Marking..." : markedContacted ? "Marked" : "Mark as Contacted"}
                      </button>
                    )}

                    {/* Connect email shortcut — only when no connection */}
                    {hasConnection === false && !sent && (
                      <a
                        href="/connections"
                        className="text-sm px-4 py-2.5 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 border border-indigo-500/25 rounded-xl transition-colors font-medium"
                      >
                        Connect Email
                      </a>
                    )}

                    <button
                      onClick={() => { setSent(false); setMarkedContacted(false); generate(messageType, selectedTemplateId || undefined); }}
                      className="text-sm px-4 py-2.5 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800 rounded-xl transition-colors font-medium"
                    >
                      Regenerate
                    </button>
                    <button
                      onClick={() => { setSent(false); setMarkedContacted(false); generate(messageType === "outreach" ? "followup" : "outreach"); }}
                      className="text-sm px-4 py-2.5 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800 rounded-xl transition-colors font-medium"
                    >
                      {messageType === "outreach" ? "Follow-up" : "Outreach"}
                    </button>
                  </div>

                  {leads && (
                    <NavRow
                      prevLead={prevLead}
                      nextLead={nextLead}
                      currentIndex={currentIndex}
                      total={actionableLeads.length}
                      onPrev={goPrev}
                      onNext={goNext}
                    />
                  )}
                </div>
              )}
            </>
          )}

          {tab === "history" && (
            <div className="animate-fade-in">
              {historyLoading && <SkeletonLines />}

              {!historyLoading && logs.length === 0 && (
                <p className="text-sm text-zinc-500 text-center py-8">
                  No emails sent to this lead yet.
                </p>
              )}

              {/* Sequence status */}
              {!historyLoading && sequence && (
                <div className="mb-5 bg-zinc-800/30 border border-zinc-800/60 rounded-xl p-4">
                  <div className="text-[11px] uppercase tracking-wider text-indigo-400/80 font-semibold mb-3">
                    Email Sequence
                  </div>
                  <div className="flex items-center gap-3">
                    {[1, 2, 3].map((step) => {
                      const isSent =
                        step === 1
                          ? !!sequence.step1SentAt
                          : step === 2
                            ? !!sequence.step2SentAt
                            : !!sequence.step3SentAt;
                      const dueAt =
                        step === 2
                          ? sequence.step2DueAt
                          : step === 3
                            ? sequence.step3DueAt
                            : null;
                      const isPaused = !!sequence.pausedAt;

                      return (
                        <div key={step} className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                              isSent
                                ? "bg-emerald-500/20 text-emerald-400"
                                : isPaused
                                  ? "bg-zinc-800 text-zinc-600"
                                  : "bg-zinc-800 text-zinc-400"
                            }`}
                          >
                            {isSent ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            ) : (
                              step
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-500">
                            {step === 1 && "Initial"}
                            {step === 2 && (isSent ? "Day 3 sent" : dueAt ? `Due ${new Date(dueAt).toLocaleDateString()}` : "Day 3")}
                            {step === 3 && (isSent ? "Day 7 sent" : dueAt ? `Due ${new Date(dueAt).toLocaleDateString()}` : "Day 7")}
                          </div>
                          {step < 3 && (
                            <div className={`w-8 h-px ${isSent ? "bg-emerald-500/40" : "bg-zinc-800"}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {sequence.pausedAt && (
                    <p className="text-[11px] text-amber-400 mt-2">Sequence paused (lead status changed)</p>
                  )}
                </div>
              )}

              {/* Email logs */}
              {!historyLoading && logs.length > 0 && (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div key={log.id} className="bg-zinc-800/30 border border-zinc-800/60 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-zinc-200 truncate">{log.subject}</span>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {log.sequenceStep && (
                            <span className="text-[10px] bg-indigo-500/15 text-indigo-400 px-2 py-0.5 rounded-md font-medium">
                              Step {log.sequenceStep}
                            </span>
                          )}
                          <span className="text-[11px] text-zinc-500">
                            {new Date(log.sentAt).toLocaleDateString()} {new Date(log.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-3 whitespace-pre-line">{log.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NavRow({
  prevLead,
  nextLead,
  currentIndex,
  total,
  onPrev,
  onNext,
}: {
  prevLead: Lead | null;
  nextLead: Lead | null;
  currentIndex: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const position = currentIndex >= 0 ? currentIndex + 1 : 0;
  const atEnd = !nextLead;

  return (
    <div className="mt-5 pt-4 border-t border-zinc-800/60">
      {atEnd && total > 0 && position === total && (
        <p className="text-xs text-zinc-500 text-center mb-3">
          You&rsquo;re all caught up.
        </p>
      )}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onPrev}
          disabled={!prevLead}
          className="text-sm px-3.5 py-2 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-medium rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          title={prevLead ? `Previous: ${prevLead.companyName} (←)` : "No previous lead"}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Previous
        </button>
        <span className="text-[11px] text-zinc-600 tabular-nums">
          {total > 0 ? `${position} / ${total}` : ""}
        </span>
        <button
          onClick={onNext}
          disabled={!nextLead}
          className="text-sm px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500 flex items-center gap-1.5"
          title={nextLead ? `Next: ${nextLead.companyName} (→) — marks this lead as contacted` : "No more leads"}
        >
          Next Lead
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
