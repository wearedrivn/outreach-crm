"use client";

import { useState } from "react";
import type { Lead } from "@prisma/client";

const statusColors: Record<string, string> = {
  new: "bg-purple-500/15 text-purple-400",
  contacted: "bg-blue-500/15 text-blue-400",
  replied: "bg-green-500/15 text-green-400",
  booked: "bg-amber-500/15 text-amber-400",
  closed: "bg-zinc-500/15 text-zinc-500",
};

function ScoreBadge({ score }: { score: number }) {
  let color = "text-emerald-400";
  if (score <= 4) color = "text-red-400";
  else if (score <= 6) color = "text-amber-400";
  return (
    <span className="tabular-nums">
      <span className={`font-semibold ${color}`}>{score}</span>
      <span className="text-zinc-600">/10</span>
    </span>
  );
}

function isHighOpp(lead: Lead) {
  return lead.brandScore >= 7 && lead.revenueScore >= 7 && lead.contentScore <= 5;
}

type Props = {
  leads: Lead[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onEdit: (lead: Lead) => void;
  onMessage: (lead: Lead) => void;
  onRefresh: () => void;
};

export function LeadsTable({ leads, selectedIds, onSelectionChange, onEdit, onMessage, onRefresh }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const allSelected = leads.length > 0 && leads.every((l) => selectedIds.has(l.id));
  const someSelected = leads.some((l) => selectedIds.has(l.id));

  function toggleAll() {
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(leads.map((l) => l.id)));
    }
  }

  function toggleOne(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
  }

  async function handleStatusChange(lead: Lead, newStatus: string) {
    setUpdatingId(lead.id);
    await fetch(`/api/leads/${lead.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    await onRefresh();
    setUpdatingId(null);
  }

  async function handleMarkReplied(lead: Lead) {
    if (lead.status === "replied") return;
    setUpdatingId(lead.id);
    await fetch(`/api/leads/${lead.id}/reply`, { method: "POST" });
    await onRefresh();
    setUpdatingId(null);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
    await onRefresh();
    setDeletingId(null);
  }

  return (
    <>
      {/* ── Desktop table ────────────────────────────── */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-zinc-800/80 bg-zinc-900/30">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800/80">
              <th className="w-10 px-3 py-3.5">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 accent-indigo-500"
                />
              </th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Company</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Niche</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Instagram</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Email</th>
              <th className="text-center px-5 py-3.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Brand</th>
              <th className="text-center px-5 py-3.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Content</th>
              <th className="text-center px-5 py-3.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Revenue</th>
              <th className="text-center px-5 py-3.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Priority</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
              <th className="text-right px-5 py-3.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className={`hover:bg-zinc-800/30 transition-colors duration-100 ${
                  deletingId === lead.id ? "opacity-40" : ""
                } ${updatingId === lead.id ? "opacity-60" : ""} ${
                  selectedIds.has(lead.id) ? "bg-indigo-500/5" : ""
                }`}
              >
                <td className="w-10 px-3 py-3.5">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(lead.id)}
                    onChange={() => toggleOne(lead.id)}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 accent-indigo-500"
                  />
                </td>
                <td className="px-5 py-3.5 font-medium text-zinc-100">{lead.companyName}</td>
                <td className="px-5 py-3.5 text-zinc-400">{lead.niche}</td>
                <td className="px-5 py-3.5 text-indigo-400 font-mono text-xs">{lead.instagramHandle}</td>
                <td className="px-5 py-3.5 text-zinc-400 text-xs truncate max-w-[160px]">{lead.email || <span className="text-zinc-700">—</span>}</td>
                <td className="px-5 py-3.5 text-center"><ScoreBadge score={lead.brandScore} /></td>
                <td className="px-5 py-3.5 text-center"><ScoreBadge score={lead.contentScore} /></td>
                <td className="px-5 py-3.5 text-center"><ScoreBadge score={lead.revenueScore} /></td>
                <td className="px-5 py-3.5 text-center">
                  {isHighOpp(lead) ? (
                    <span className="inline-block bg-orange-500/15 text-orange-400 text-[10px] font-bold px-2.5 py-1 rounded-lg tracking-wide uppercase">
                      High Opp
                    </span>
                  ) : (
                    <span className="text-zinc-700">--</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <select
                    value={lead.status}
                    onChange={(e) => handleStatusChange(lead, e.target.value)}
                    className={`text-xs font-medium rounded-lg px-3 py-1.5 border-0 cursor-pointer appearance-none ${
                      statusColors[lead.status] || statusColors.new
                    }`}
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="replied">Replied</option>
                    <option value="booked">Booked</option>
                    <option value="closed">Closed</option>
                  </select>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onMessage(lead)}
                      className="text-xs px-3 py-1.5 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors duration-100"
                    >
                      Outreach
                    </button>
                    {lead.status !== "replied" && lead.status !== "booked" && lead.status !== "closed" && (
                      <button
                        onClick={() => handleMarkReplied(lead)}
                        className="text-xs px-3 py-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors duration-100"
                      >
                        Replied
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(lead)}
                      className="text-xs px-3 py-1.5 text-zinc-400 hover:bg-zinc-800 rounded-lg transition-colors duration-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(lead.id)}
                      disabled={deletingId === lead.id}
                      className="text-xs px-2 py-1.5 text-zinc-600 hover:text-red-400 transition-colors duration-100 disabled:opacity-30"
                    >
                      {deletingId === lead.id ? (
                        <span className="inline-block w-3 h-3 border border-zinc-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile cards ─────────────────────────────── */}
      <div className="md:hidden space-y-3">
        {leads.map((lead) => (
          <div
            key={lead.id}
            className={`bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-4 transition-opacity duration-150 ${
              deletingId === lead.id ? "opacity-40" : ""
            } ${selectedIds.has(lead.id) ? "border-indigo-500/30 bg-indigo-500/5" : ""}`}
          >
            {/* Header row */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <input
                  type="checkbox"
                  checked={selectedIds.has(lead.id)}
                  onChange={() => toggleOne(lead.id)}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 accent-indigo-500 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-zinc-100 truncate">{lead.companyName}</h3>
                    {isHighOpp(lead) && (
                      <span className="shrink-0 bg-orange-500/15 text-orange-400 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide">
                        High Opp
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-zinc-500">{lead.niche}</span>
                    <span className="text-xs text-indigo-400 font-mono">{lead.instagramHandle}</span>
                  </div>
                </div>
              </div>
              <select
                value={lead.status}
                onChange={(e) => handleStatusChange(lead, e.target.value)}
                className={`text-[11px] font-medium rounded-lg px-2.5 py-1 border-0 cursor-pointer appearance-none shrink-0 ${
                  statusColors[lead.status] || statusColors.new
                }`}
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="replied">Replied</option>
                <option value="booked">Booked</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Scores */}
            <div className="flex items-center gap-4 text-xs text-zinc-500 mb-3">
              <span>Brand <ScoreBadge score={lead.brandScore} /></span>
              <span>Content <ScoreBadge score={lead.contentScore} /></span>
              <span>Revenue <ScoreBadge score={lead.revenueScore} /></span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/50">
              <button
                onClick={() => onMessage(lead)}
                className="flex-1 text-xs py-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors text-center font-medium"
              >
                Outreach
              </button>
              {lead.status !== "replied" && lead.status !== "booked" && lead.status !== "closed" && (
                <button
                  onClick={() => handleMarkReplied(lead)}
                  className="flex-1 text-xs py-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors text-center font-medium"
                >
                  Replied
                </button>
              )}
              <button
                onClick={() => onEdit(lead)}
                className="flex-1 text-xs py-2 text-zinc-400 hover:bg-zinc-800 rounded-lg transition-colors text-center font-medium"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(lead.id)}
                disabled={deletingId === lead.id}
                className="px-3 py-2 text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-30"
              >
                {deletingId === lead.id ? (
                  <span className="inline-block w-3 h-3 border border-zinc-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
