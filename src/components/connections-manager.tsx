"use client";

import { useState, useEffect } from "react";

type Connection = {
  id: string;
  provider: string;
  email: string;
  status: string;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
};

type Config = {
  gmail: boolean;
  outlook: boolean;
  smtp: boolean;
};

type SmtpForm = {
  email: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPass: string;
  imapHost: string;
  imapPort: string;
};

const EMPTY_SMTP: SmtpForm = {
  email: "",
  smtpHost: "",
  smtpPort: "587",
  smtpUser: "",
  smtpPass: "",
  imapHost: "",
  imapPort: "",
};

const ERROR_LABELS: Record<string, string> = {
  gmail_not_configured: "Gmail is not configured on this server.",
  outlook_not_configured: "Outlook is not configured on this server.",
  no_code: "OAuth provider did not return an authorization code.",
  state_mismatch: "Security check failed. Please try again.",
  token_exchange_failed: "Could not exchange token with the provider.",
  userinfo_failed: "Could not retrieve your email from the provider.",
  no_email: "The provider did not return an email address.",
};

export function ConnectionsManager() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [config, setConfig] = useState<Config>({ gmail: false, outlook: false, smtp: false });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [smtpOpen, setSmtpOpen] = useState(false);
  const [smtpForm, setSmtpForm] = useState<SmtpForm>(EMPTY_SMTP);
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpError, setSmtpError] = useState("");
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  useEffect(() => {
    loadConnections();

    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    const error = params.get("error");
    if (connected) {
      setToast({ type: "success", message: `${connected.charAt(0).toUpperCase() + connected.slice(1)} connected successfully.` });
      window.history.replaceState({}, "", window.location.pathname);
    } else if (error) {
      setToast({ type: "error", message: ERROR_LABELS[error] || `Connection error: ${error}` });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  async function loadConnections() {
    setLoading(true);
    try {
      const res = await fetch("/api/connections");
      const data = await res.json();
      setConnections(data.connections ?? []);
      setConfig(data.config ?? { gmail: false, outlook: false, smtp: false });
    } catch {
      setToast({ type: "error", message: "Failed to load connections." });
    }
    setLoading(false);
  }

  async function handleDisconnect(id: string) {
    if (!confirm("Disconnect this email? Outreach will fall back to the default sender.")) return;
    setDisconnecting(id);
    try {
      await fetch(`/api/connections/${id}`, { method: "DELETE" });
      await loadConnections();
      setToast({ type: "success", message: "Disconnected." });
    } catch {
      setToast({ type: "error", message: "Failed to disconnect." });
    }
    setDisconnecting(null);
  }

  async function handleSmtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSmtpSaving(true);
    setSmtpError("");
    try {
      const res = await fetch("/api/connections/smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: smtpForm.email,
          smtpHost: smtpForm.smtpHost,
          smtpPort: Number(smtpForm.smtpPort),
          smtpUser: smtpForm.smtpUser,
          smtpPass: smtpForm.smtpPass,
          imapHost: smtpForm.imapHost || undefined,
          imapPort: smtpForm.imapPort ? Number(smtpForm.imapPort) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSmtpError(data.error || "Connection failed.");
        setSmtpSaving(false);
        return;
      }
      setSmtpOpen(false);
      setSmtpForm(EMPTY_SMTP);
      await loadConnections();
      setToast({ type: "success", message: "SMTP email connected." });
    } catch {
      setSmtpError("Network error.");
    }
    setSmtpSaving(false);
  }

  function getConnection(provider: string) {
    return connections.find((c) => c.provider === provider);
  }

  const gmail = getConnection("gmail");
  const outlook = getConnection("outlook");
  const smtp = getConnection("smtp");

  return (
    <div className="animate-slide-up">
      {toast && (
        <div
          className={`mb-5 text-sm rounded-xl px-4 py-3 border ${
            toast.type === "success"
              ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
              : "text-red-400 bg-red-500/10 border-red-500/20"
          }`}
        >
          {toast.message}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16">
          <span className="inline-block w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ProviderCard
            name="Gmail"
            description="Connect via Google OAuth"
            connection={gmail}
            configured={config.gmail}
            onConnect={() => { window.location.href = "/api/connections/gmail/start"; }}
            onDisconnect={() => gmail && handleDisconnect(gmail.id)}
            disconnecting={disconnecting === gmail?.id}
          />
          <ProviderCard
            name="Outlook"
            description="Connect via Microsoft OAuth"
            connection={outlook}
            configured={config.outlook}
            onConnect={() => { window.location.href = "/api/connections/outlook/start"; }}
            onDisconnect={() => outlook && handleDisconnect(outlook.id)}
            disconnecting={disconnecting === outlook?.id}
          />
          <ProviderCard
            name="Other Email"
            description="Connect via SMTP"
            connection={smtp}
            configured={config.smtp}
            onConnect={() => {
              setSmtpError("");
              setSmtpForm(EMPTY_SMTP);
              setSmtpOpen(true);
            }}
            onDisconnect={() => smtp && handleDisconnect(smtp.id)}
            disconnecting={disconnecting === smtp?.id}
          />
        </div>
      )}

      {smtpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleSmtpSubmit}
            className="bg-zinc-900 border border-zinc-800/80 rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 animate-slide-up"
          >
            <h2 className="text-lg font-semibold mb-4">Connect SMTP Email</h2>

            {smtpError && (
              <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {smtpError}
              </div>
            )}

            <div className="space-y-3">
              <Field label="Email address" required>
                <input
                  type="email"
                  required
                  value={smtpForm.email}
                  onChange={(e) => setSmtpForm({ ...smtpForm, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 transition-all"
                />
              </Field>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Field label="SMTP host" required>
                    <input
                      type="text"
                      required
                      value={smtpForm.smtpHost}
                      onChange={(e) => setSmtpForm({ ...smtpForm, smtpHost: e.target.value })}
                      placeholder="smtp.example.com"
                      className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 transition-all"
                    />
                  </Field>
                </div>
                <Field label="Port" required>
                  <input
                    type="number"
                    required
                    value={smtpForm.smtpPort}
                    onChange={(e) => setSmtpForm({ ...smtpForm, smtpPort: e.target.value })}
                    placeholder="587"
                    className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 transition-all"
                  />
                </Field>
              </div>

              <Field label="SMTP username" required>
                <input
                  type="text"
                  required
                  value={smtpForm.smtpUser}
                  onChange={(e) => setSmtpForm({ ...smtpForm, smtpUser: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 transition-all"
                />
              </Field>

              <Field label="SMTP password" required>
                <input
                  type="password"
                  required
                  value={smtpForm.smtpPass}
                  onChange={(e) => setSmtpForm({ ...smtpForm, smtpPass: e.target.value })}
                  placeholder="App password or SMTP password"
                  className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 transition-all"
                />
              </Field>

              <div className="pt-2 border-t border-zinc-800/80">
                <p className="text-xs text-zinc-500 mb-3">Optional: IMAP for reading replies</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Field label="IMAP host">
                      <input
                        type="text"
                        value={smtpForm.imapHost}
                        onChange={(e) => setSmtpForm({ ...smtpForm, imapHost: e.target.value })}
                        placeholder="imap.example.com"
                        className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 transition-all"
                      />
                    </Field>
                  </div>
                  <Field label="Port">
                    <input
                      type="number"
                      value={smtpForm.imapPort}
                      onChange={(e) => setSmtpForm({ ...smtpForm, imapPort: e.target.value })}
                      placeholder="993"
                      className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 transition-all"
                    />
                  </Field>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setSmtpOpen(false)}
                className="text-sm px-4 py-2 rounded-xl bg-zinc-800 text-zinc-400 border border-zinc-700/60 hover:bg-zinc-700/60 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={smtpSaving}
                className="text-sm px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-xl transition-all duration-150"
              >
                {smtpSaving ? "Verifying..." : "Connect"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-zinc-400 mb-1 block">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}

function ProviderCard({
  name,
  description,
  connection,
  configured,
  onConnect,
  onDisconnect,
  disconnecting,
}: {
  name: string;
  description: string;
  connection?: Connection;
  configured: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  disconnecting: boolean;
}) {
  const connected = !!connection && connection.status === "active";

  return (
    <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{name}</h3>
          <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
        </div>
        {connected && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Connected
          </span>
        )}
      </div>

      {connected ? (
        <div className="flex-1">
          <p className="text-sm text-zinc-300 font-mono truncate mb-1">{connection.email}</p>
          {connection.lastError && (
            <p className="text-xs text-amber-400 mt-1 line-clamp-2">{connection.lastError}</p>
          )}
        </div>
      ) : (
        <div className="flex-1">
          {!configured && (
            <p className="text-xs text-zinc-600 italic">Not configured on this server.</p>
          )}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-zinc-800/60">
        {connected ? (
          <button
            onClick={onDisconnect}
            disabled={disconnecting}
            className="text-xs px-3 py-1.5 rounded-lg text-red-400 border border-red-500/20 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
          >
            {disconnecting ? "Disconnecting..." : "Disconnect"}
          </button>
        ) : (
          <button
            onClick={onConnect}
            disabled={!configured}
            className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-medium transition-all duration-150"
          >
            Connect
          </button>
        )}
      </div>
    </div>
  );
}
