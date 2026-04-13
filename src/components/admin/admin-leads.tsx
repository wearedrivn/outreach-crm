"use client";

import { useState, useEffect } from "react";

type Lead = {
  id: string;
  companyName: string;
  niche: string;
  instagramHandle: string;
  brandScore: number;
  contentScore: number;
  revenueScore: number;
  status: string;
  createdAt: string;
  user: { name: string; email: string };
};

const statusColors: Record<string, string> = {
  new: "bg-purple-500/15 text-purple-400",
  contacted: "bg-blue-500/15 text-blue-400",
  replied: "bg-green-500/15 text-green-400",
  booked: "bg-amber-500/15 text-amber-400",
  closed: "bg-zinc-500/15 text-zinc-500",
};

export function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [revenueFilter, setRevenueFilter] = useState("");
  const [nicheFilter, setNicheFilter] = useState("");
  const [highOppFilter, setHighOppFilter] = useState(false);

  async function loadLeads() {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (revenueFilter) params.set("revenue", revenueFilter);
    if (nicheFilter) params.set("niche", nicheFilter);
    if (highOppFilter) params.set("highOpp", "true");

    const res = await fetch(`/api/admin/leads?${params}`);
    const data = await res.json();
    setLeads(data);
    setLoading(false);
  }

  useEffect(() => { loadLeads(); }, [statusFilter, revenueFilter, nicheFilter, highOppFilter]);

  async function deleteLead(id: string) {
    setDeletingId(id);
    await fetch(`/api/admin/leads/${id}`, { method: "DELETE" });
    await loadLeads();
    setDeletingId(null);
    setConfirmDelete(null);
  }

  function isHighOpp(l: Lead) {
    return l.brandScore >= 7 && l.revenueScore >= 7 && l.contentScore <= 5;
  }

  return (
    <div className="animate-slide-up space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 appearance-none cursor-pointer"
        >
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="replied">Replied</option>
          <option value="booked">Booked</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={revenueFilter}
          onChange={(e) => setRevenueFilter(e.target.value)}
          className="text-xs bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 appearance-none cursor-pointer"
        >
          <option value="">All revenue</option>
          <option value="high">High (8-10)</option>
          <option value="solid">Solid (6-7)</option>
          <option value="moderate">Moderate (4-5)</option>
          <option value="early">Early (&lt;4)</option>
        </select>

        <input
          value={nicheFilter}
          onChange={(e) => setNicheFilter(e.target.value)}
          placeholder="Filter by niche..."
          className="text-xs bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 placeholder:text-zinc-600 w-40"
        />

        <button
          onClick={() => setHighOppFilter(!highOppFilter)}
          className={`text-xs px-3 py-2 rounded-lg font-medium transition-all ${
            highOppFilter
              ? "bg-orange-500/15 text-orange-400 border border-orange-500/25"
              : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700"
          }`}
        >
          HIGH OPP
        </button>

        <span className="text-xs text-zinc-600 ml-1">
          {leads.length} result{leads.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-16 text-zinc-500 text-sm">
          No leads match the current filters.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-800/80 bg-zinc-900/30">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800/80">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Company</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Niche</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Owner</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">B/C/R</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Priority</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className={`hover:bg-zinc-800/30 transition-colors ${deletingId === lead.id ? "opacity-40" : ""}`}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-100">{lead.companyName}</div>
                    <div className="text-xs text-indigo-400 font-mono">{lead.instagramHandle}</div>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{lead.niche}</td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-zinc-300">{lead.user.name}</div>
                    <div className="text-[11px] text-zinc-600 font-mono">{lead.user.email}</div>
                  </td>
                  <td className="px-4 py-3 text-center text-xs tabular-nums text-zinc-400">
                    {lead.brandScore}/{lead.contentScore}/{lead.revenueScore}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isHighOpp(lead) ? (
                      <span className="inline-block bg-orange-500/15 text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase">
                        High Opp
                      </span>
                    ) : (
                      <span className="text-zinc-700">--</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium rounded-lg px-2.5 py-1 capitalize ${statusColors[lead.status] || statusColors.new}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {confirmDelete === lead.id ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => deleteLead(lead.id)}
                          disabled={deletingId === lead.id}
                          className="text-xs px-3 py-1.5 bg-red-500/15 text-red-400 rounded-lg hover:bg-red-500/25 transition-colors disabled:opacity-30"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="text-xs px-2 py-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(lead.id)}
                        className="text-xs px-2 py-1.5 text-zinc-600 hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
