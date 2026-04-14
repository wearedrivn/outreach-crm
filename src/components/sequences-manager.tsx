"use client";

import { useState, useEffect } from "react";

type Step = {
  stepNumber: number;
  subjectTemplate: string;
  bodyTemplate: string;
  delayDays: number;
};

type Sequence = {
  id: string;
  name: string;
  description: string;
  active: boolean;
  steps: Step[];
  createdAt: string;
};

export function SequencesManager() {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Sequence | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadSequences();
  }, []);

  async function loadSequences() {
    setLoading(true);
    const res = await fetch("/api/sequences");
    const data = await res.json();
    setSequences(data);
    setLoading(false);
  }

  async function handleToggle(seq: Sequence) {
    await fetch(`/api/sequences/${seq.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !seq.active }),
    });
    loadSequences();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this sequence? Active leads using it will lose their sequence.")) return;
    await fetch(`/api/sequences/${id}`, { method: "DELETE" });
    loadSequences();
  }

  return (
    <div className="animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <span className="text-xs text-zinc-600">{sequences.length} sequence{sequences.length !== 1 && "s"}</span>
        <button
          onClick={() => setCreating(true)}
          className="text-sm px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-150"
        >
          + New Sequence
        </button>
      </div>

      {loading && (
        <div className="text-center py-16">
          <span className="inline-block w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      )}

      {!loading && sequences.length === 0 && (
        <div className="text-center py-16">
          <p className="text-zinc-400 text-sm font-medium mb-1">No sequences yet</p>
          <p className="text-zinc-600 text-sm">Create your first email sequence to automate follow-ups.</p>
        </div>
      )}

      {!loading && sequences.length > 0 && (
        <div className="space-y-4">
          {sequences.map((seq) => (
            <div key={seq.id} className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-sm font-medium text-zinc-100">{seq.name}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide ${
                      seq.active
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-zinc-800 text-zinc-600"
                    }`}>
                      {seq.active ? "Active" : "Paused"}
                    </span>
                  </div>
                  {seq.description && (
                    <p className="text-xs text-zinc-500 mt-1">{seq.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggle(seq)}
                    className="text-xs px-3 py-1.5 text-zinc-400 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    {seq.active ? "Pause" : "Activate"}
                  </button>
                  <button
                    onClick={() => setEditing(seq)}
                    className="text-xs px-3 py-1.5 text-zinc-400 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(seq.id)}
                    className="text-xs px-2 py-1.5 text-zinc-600 hover:text-red-400 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Steps preview */}
              <div className="flex items-center gap-2 flex-wrap">
                {seq.steps.map((step, i) => (
                  <div key={step.stepNumber} className="flex items-center gap-2">
                    <div className="bg-zinc-800/60 border border-zinc-700/40 rounded-lg px-3 py-2 text-xs">
                      <span className="text-indigo-400 font-medium">Step {step.stepNumber}</span>
                      <span className="text-zinc-600 mx-1.5">|</span>
                      <span className="text-zinc-400">
                        {step.delayDays === 0 ? "Immediate" : `Day ${step.delayDays}`}
                      </span>
                    </div>
                    {i < seq.steps.length - 1 && (
                      <div className="w-4 h-px bg-zinc-800" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <SequenceEditor
          sequence={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => { setCreating(false); setEditing(null); loadSequences(); }}
        />
      )}
    </div>
  );
}

function SequenceEditor({
  sequence,
  onClose,
  onSaved,
}: {
  sequence: Sequence | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(sequence?.name || "");
  const [description, setDescription] = useState(sequence?.description || "");
  const [steps, setSteps] = useState<Step[]>(
    sequence?.steps.length
      ? sequence.steps
      : [
          { stepNumber: 1, subjectTemplate: "Quick thought on {{companyName}}", bodyTemplate: "", delayDays: 0 },
          { stepNumber: 2, subjectTemplate: "Following up — {{companyName}}", bodyTemplate: "", delayDays: 3 },
          { stepNumber: 3, subjectTemplate: "One last thought — {{companyName}}", bodyTemplate: "", delayDays: 7 },
        ],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function addStep() {
    const lastDelay = steps.length > 0 ? steps[steps.length - 1].delayDays : 0;
    setSteps([
      ...steps,
      {
        stepNumber: steps.length + 1,
        subjectTemplate: "",
        bodyTemplate: "",
        delayDays: lastDelay + 3,
      },
    ]);
  }

  function removeStep(index: number) {
    const next = steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, stepNumber: i + 1 }));
    setSteps(next);
  }

  function updateStep(index: number, field: keyof Step, value: string | number) {
    const next = [...steps];
    next[index] = { ...next[index], [field]: value };
    setSteps(next);
  }

  async function handleSave() {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (steps.length === 0) {
      setError("At least one step is required.");
      return;
    }

    setSaving(true);
    setError("");

    const url = sequence ? `/api/sequences/${sequence.id}` : "/api/sequences";
    const method = sequence ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, steps }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to save.");
      setSaving(false);
      return;
    }

    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm overlay-backdrop p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl shadow-black/40 animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-lg font-semibold tracking-tight">
            {sequence ? "Edit Sequence" : "New Sequence"}
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
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Sequence Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Default Outreach"
                className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-medium text-zinc-400">Steps</label>
              <button
                onClick={addStep}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                + Add Step
              </button>
            </div>

            <div className="space-y-3">
              {steps.map((step, i) => (
                <div key={i} className="bg-zinc-800/30 border border-zinc-800/60 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-indigo-400">Step {step.stepNumber}</span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs text-zinc-500">
                        Delay:
                        <input
                          type="number"
                          min="0"
                          value={step.delayDays}
                          onChange={(e) => updateStep(i, "delayDays", Number(e.target.value))}
                          className="w-14 bg-zinc-800 border border-zinc-700/60 rounded-lg px-2 py-1 text-xs text-zinc-100 text-center"
                        />
                        days
                      </label>
                      {steps.length > 1 && (
                        <button
                          onClick={() => removeStep(i)}
                          className="text-zinc-600 hover:text-red-400 transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    value={step.subjectTemplate}
                    onChange={(e) => updateStep(i, "subjectTemplate", e.target.value)}
                    placeholder="Subject template (use {{companyName}}, {{niche}})"
                    className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
                  />
                  <textarea
                    value={step.bodyTemplate}
                    onChange={(e) => updateStep(i, "bodyTemplate", e.target.value)}
                    rows={3}
                    placeholder="Body template (use {{companyName}}, {{niche}}, {{instagramHandle}}). Leave empty for auto-generated."
                    className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 resize-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-zinc-600">
            Use {"{{companyName}}"}, {"{{niche}}"}, {"{{instagramHandle}}"} in templates. Leave body empty to auto-generate using AI/templates.
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="text-sm px-4 py-2.5 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800 rounded-xl transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-sm px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-500 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {saving ? "Saving..." : sequence ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
