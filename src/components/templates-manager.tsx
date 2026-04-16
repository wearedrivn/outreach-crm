"use client";

import { useState, useEffect, useMemo } from "react";
import { TEMPLATE_VARIABLES } from "@/lib/message-templates";

type MessageTemplate = {
  id: string;
  name: string;
  description: string;
  body: string;
  type: "outreach" | "followup";
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export function TemplatesManager() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<MessageTemplate | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    setLoading(true);
    try {
      const res = await fetch("/api/message-templates");
      const data = await res.json();
      if (Array.isArray(data)) setTemplates(data);
    } catch {
      setError("Failed to load templates.");
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this template? This cannot be undone.")) return;
    await fetch(`/api/message-templates/${id}`, { method: "DELETE" });
    loadTemplates();
  }

  const outreach = templates.filter((t) => t.type === "outreach");
  const followup = templates.filter((t) => t.type === "followup");

  return (
    <div className="animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <span className="text-xs text-zinc-600">
          {templates.length} template{templates.length !== 1 && "s"}
        </span>
        <button
          onClick={() => setCreating(true)}
          className="text-sm px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-150"
        >
          + New Template
        </button>
      </div>

      {error && (
        <div className="mb-5 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-16">
          <span className="inline-block w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      )}

      {!loading && templates.length === 0 && (
        <div className="text-center py-16">
          <p className="text-zinc-400 text-sm font-medium mb-1">No templates yet</p>
          <p className="text-zinc-600 text-sm">Create your first message template.</p>
        </div>
      )}

      {!loading && templates.length > 0 && (
        <div className="space-y-8">
          <TemplateGroup
            title="Outreach"
            templates={outreach}
            onEdit={setEditing}
            onDelete={handleDelete}
          />
          {followup.length > 0 && (
            <TemplateGroup
              title="Follow-up"
              templates={followup}
              onEdit={setEditing}
              onDelete={handleDelete}
            />
          )}
        </div>
      )}

      {(creating || editing) && (
        <TemplateEditor
          template={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            loadTemplates();
          }}
        />
      )}
    </div>
  );
}

function TemplateGroup({
  title,
  templates,
  onEdit,
  onDelete,
}: {
  title: string;
  templates: MessageTemplate[];
  onEdit: (t: MessageTemplate) => void;
  onDelete: (id: string) => void;
}) {
  if (templates.length === 0) return null;
  return (
    <section>
      <h2 className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold mb-3">
        {title}
      </h2>
      <div className="space-y-3">
        {templates.map((t) => (
          <div
            key={t.id}
            className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-sm font-medium text-zinc-100">{t.name}</h3>
                  {t.isDefault && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide bg-indigo-500/15 text-indigo-400">
                      Default
                    </span>
                  )}
                </div>
                {t.description && (
                  <p className="text-xs text-zinc-500 mt-1">{t.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => onEdit(t)}
                  className="text-xs px-3 py-1.5 text-zinc-400 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(t.id)}
                  className="text-xs px-2 py-1.5 text-zinc-600 hover:text-red-400 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <pre className="text-xs text-zinc-400 bg-zinc-800/30 border border-zinc-800/60 rounded-xl p-3 whitespace-pre-wrap font-sans line-clamp-4 overflow-hidden">
              {t.body}
            </pre>
          </div>
        ))}
      </div>
    </section>
  );
}

function TemplateEditor({
  template,
  onClose,
  onSaved,
}: {
  template: MessageTemplate | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(template?.name || "");
  const [description, setDescription] = useState(template?.description || "");
  const [body, setBody] = useState(template?.body || "");
  const [type, setType] = useState<"outreach" | "followup">(template?.type || "outreach");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const preview = useMemo(() => {
    const examples: Record<string, string> = Object.fromEntries(
      TEMPLATE_VARIABLES.map((v) => [v.key, v.example]),
    );
    return body.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_m, key: string) => {
      const k = key.toLowerCase();
      return examples[k] ?? "";
    });
  }, [body]);

  function insertVariable(key: string) {
    setBody((b) => `${b}{{${key}}}`);
  }

  async function handleSave() {
    const trimmedName = name.trim();
    const trimmedBody = body.trim();
    if (!trimmedName) {
      setError("Name is required.");
      return;
    }
    if (!trimmedBody) {
      setError("Template body cannot be empty.");
      return;
    }

    setSaving(true);
    setError("");

    const url = template ? `/api/message-templates/${template.id}` : "/api/message-templates";
    const method = template ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: trimmedName,
        description: description.trim(),
        body: trimmedBody,
        type,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to save template.");
      setSaving(false);
      return;
    }

    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm overlay-backdrop p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl shadow-2xl shadow-black/40 animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-lg font-semibold tracking-tight">
            {template ? "Edit Template" : "New Template"}
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

        <div className="border-t border-zinc-800/60" />

        <div className="p-6 space-y-5">
          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Direct observation"
                className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "outreach" | "followup")}
                className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-2.5 text-sm text-zinc-100"
              >
                <option value="outreach">Outreach</option>
                <option value="followup">Follow-up</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional short description"
              className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-zinc-400">Variables</label>
              <span className="text-[10px] text-zinc-600">Click to insert</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_VARIABLES.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => insertVariable(v.key)}
                  className="text-[11px] font-mono px-2 py-1 rounded-md bg-zinc-800/80 border border-zinc-700/50 text-indigo-300 hover:bg-zinc-700/80 hover:text-indigo-200 transition-colors"
                  title={v.label}
                >
                  {`{{${v.key}}}`}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Body *</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              placeholder="Write your template. Use variables like {{company_name}}, {{niche}}, {{observation}}..."
              className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 resize-y font-mono leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Preview <span className="text-zinc-600 font-normal">(with example data)</span>
            </label>
            <pre className="bg-zinc-800/30 border border-zinc-800/60 border-l-2 border-l-indigo-500 rounded-xl p-4 text-sm text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed min-h-24">
              {preview || <span className="text-zinc-600">Preview will appear here…</span>}
            </pre>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="text-sm px-4 py-2.5 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-sm px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-500 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {saving ? "Saving..." : template ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
