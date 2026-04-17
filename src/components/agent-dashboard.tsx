"use client";

import { useState, useEffect, useCallback } from "react";

type AgentSettings = {
  enabled: boolean;
  autoGenerateMsg: boolean;
  autoSendFirst: boolean;
  autoEnrollSequence: boolean;
  highOppOnly: boolean;
  maxDailySends: number;
  stopOnReply: boolean;
};

type LogEntry = {
  id: string;
  action: string;
  detail: string;
  status: string;
  leadId: string | null;
  createdAt: string;
};

type Stats = {
  todaySends: number;
  queueCount: number;
};

const DEFAULT_SETTINGS: AgentSettings = {
  enabled: false,
  autoGenerateMsg: true,
  autoSendFirst: false,
  autoEnrollSequence: true,
  highOppOnly: false,
  maxDailySends: 20,
  stopOnReply: true,
};

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  score_calculated: { label: "Score calculated", color: "text-blue-400" },
  email_found: { label: "Email found", color: "text-cyan-400" },
  message_generated: { label: "Message generated", color: "text-violet-400" },
  email_sent: { label: "Email sent", color: "text-emerald-400" },
  email_failed: { label: "Send failed", color: "text-red-400" },
  sequence_started: { label: "Sequence started", color: "text-amber-400" },
  skipped: { label: "Skipped", color: "text-zinc-500" },
  error: { label: "Error", color: "text-red-400" },
};

export function AgentDashboard() {
  const [settings, setSettings] = useState<AgentSettings>(DEFAULT_SETTINGS);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<Stats>({ todaySends: 0, queueCount: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [settingsRes, logsRes] = await Promise.all([
        fetch("/api/agent/settings"),
        fetch("/api/agent/logs?limit=50"),
      ]);
      const settingsData = await settingsRes.json();
      const logsData = await logsRes.json();
      setSettings(settingsData);
      setLogs(logsData.logs ?? []);
      setStats(logsData.stats ?? { todaySends: 0, queueCount: 0 });
    } catch {
      setError("Failed to load agent data.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function updateSetting(key: keyof AgentSettings, value: boolean | number) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/agent/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      const data = await res.json();
      if (res.ok) setSettings(data);
      else setError(data.error || "Failed to update.");
    } catch {
      setError("Network error.");
    }
    setSaving(false);
  }

  async function handleRun() {
    setRunning(true);
    setRunResult(null);
    setError("");
    try {
      const res = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Agent run failed.");
        setRunning(false);
        return;
      }
      const r = data.result;
      const parts = [];
      if (r.processed) parts.push(`${r.processed} processed`);
      if (r.emailsSent) parts.push(`${r.emailsSent} sent`);
      if (r.messagesGenerated) parts.push(`${r.messagesGenerated} messages`);
      if (r.sequencesStarted) parts.push(`${r.sequencesStarted} sequences`);
      if (r.skipped) parts.push(`${r.skipped} skipped`);
      if (r.errors) parts.push(`${r.errors} errors`);
      setRunResult(parts.length ? parts.join(", ") : "No leads to process.");
      await loadData();
    } catch {
      setError("Network error.");
    }
    setRunning(false);
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <span className="inline-block w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-slide-up space-y-6">
      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {runResult && (
        <div className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
          Agent run complete: {runResult}
        </div>
      )}

      {/* Status + Run */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${settings.enabled ? "bg-emerald-400 shadow-lg shadow-emerald-400/30" : "bg-zinc-600"}`} />
            <h2 className="text-sm font-semibold text-white">
              Agent {settings.enabled ? "Active" : "Inactive"}
            </h2>
          </div>
          <button
            onClick={() => updateSetting("enabled", !settings.enabled)}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
              settings.enabled ? "bg-indigo-600" : "bg-zinc-700"
            } ${saving ? "opacity-50" : ""}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                settings.enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <StatCard label="Queue" value={stats.queueCount} sub="new leads" />
          <StatCard label="Sent today" value={stats.todaySends} sub={`/ ${settings.maxDailySends} limit`} />
          <StatCard label="Remaining" value={Math.max(0, settings.maxDailySends - stats.todaySends)} sub="sends left" />
        </div>

        <button
          onClick={handleRun}
          disabled={running || !settings.enabled}
          className="w-full text-sm px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-150"
        >
          {running ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing leads...
            </span>
          ) : (
            "Run Agent Now"
          )}
        </button>
      </div>

      {/* Settings */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Agent Settings</h2>
        <div className="space-y-3">
          <Toggle
            label="Auto-generate messages"
            description="Generate outreach messages for new leads"
            checked={settings.autoGenerateMsg}
            onChange={(v) => updateSetting("autoGenerateMsg", v)}
            disabled={saving}
          />
          <Toggle
            label="Auto-send first email"
            description="Automatically send the initial outreach email"
            checked={settings.autoSendFirst}
            onChange={(v) => updateSetting("autoSendFirst", v)}
            disabled={saving}
          />
          <Toggle
            label="Auto-enroll in sequence"
            description="Start follow-up sequence after first email"
            checked={settings.autoEnrollSequence}
            onChange={(v) => updateSetting("autoEnrollSequence", v)}
            disabled={saving}
          />
          <Toggle
            label="High opportunity only"
            description="Only process leads with high brand + revenue and low content scores"
            checked={settings.highOppOnly}
            onChange={(v) => updateSetting("highOppOnly", v)}
            disabled={saving}
          />
          <Toggle
            label="Stop on reply"
            description="Pause all automation when a lead replies"
            checked={settings.stopOnReply}
            onChange={(v) => updateSetting("stopOnReply", v)}
            disabled={saving}
          />

          <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
            <div>
              <p className="text-sm text-white font-medium">Max daily sends</p>
              <p className="text-xs text-zinc-500">Limit outbound emails per day (1 to 100)</p>
            </div>
            <input
              type="number"
              min={1}
              max={100}
              value={settings.maxDailySends}
              onChange={(e) => {
                const v = Math.max(1, Math.min(100, Number(e.target.value) || 1));
                setSettings((s) => ({ ...s, maxDailySends: v }));
              }}
              onBlur={() => updateSetting("maxDailySends", settings.maxDailySends)}
              className="w-20 text-center bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Recent Activity</h2>
          <span className="text-xs text-zinc-600">{logs.length} entries</span>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-zinc-500 text-sm">No agent activity yet.</p>
            <p className="text-zinc-600 text-xs mt-1">Enable Agent Mode and run it to see actions here.</p>
          </div>
        ) : (
          <div className="space-y-1 max-h-[480px] overflow-y-auto pr-1">
            {logs.map((log) => {
              const meta = ACTION_LABELS[log.action] ?? { label: log.action, color: "text-zinc-400" };
              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-zinc-800/30 transition-colors"
                >
                  <span className={`text-xs font-medium mt-0.5 whitespace-nowrap ${meta.color}`}>
                    {meta.label}
                  </span>
                  <span className="text-xs text-zinc-400 flex-1 min-w-0 truncate">
                    {log.detail}
                  </span>
                  <span className="text-[10px] text-zinc-600 whitespace-nowrap mt-0.5">
                    {formatTime(log.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <p className="text-sm text-white font-medium">{label}</p>
        <p className="text-xs text-zinc-500">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
          checked ? "bg-indigo-600" : "bg-zinc-700"
        } ${disabled ? "opacity-50" : ""}`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${
            checked ? "translate-x-4.5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="bg-zinc-800/40 rounded-xl px-4 py-3 text-center">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className="text-xl font-semibold text-white">{value}</p>
      <p className="text-[10px] text-zinc-600">{sub}</p>
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
