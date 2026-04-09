"use client";

import type { Lead } from "@/generated/prisma/client";

const statusColors: Record<string, string> = {
  new: "bg-purple-500/15 text-purple-400",
  contacted: "bg-blue-500/15 text-blue-400",
  replied: "bg-green-500/15 text-green-400",
  booked: "bg-amber-500/15 text-amber-400",
  closed: "bg-zinc-500/15 text-zinc-500",
};

function ScoreBadge({ score }: { score: number }) {
  let color = "text-green-400";
  if (score <= 4) color = "text-red-400";
  else if (score <= 6) color = "text-amber-400";
  return (
    <span>
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
  onEdit: (lead: Lead) => void;
  onMessage: (lead: Lead) => void;
  onRefresh: () => void;
};

export function LeadsTable({ leads, onEdit, onMessage, onRefresh }: Props) {
  async function handleStatusChange(lead: Lead, newStatus: string) {
    await fetch(`/api/leads/${lead.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    onRefresh();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
    onRefresh();
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-16 text-zinc-500">
        No leads yet. Add your first one.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900/50">
            <th className="text-left px-4 py-3 font-medium text-zinc-400">Company</th>
            <th className="text-left px-4 py-3 font-medium text-zinc-400">Niche</th>
            <th className="text-left px-4 py-3 font-medium text-zinc-400">Instagram</th>
            <th className="text-center px-4 py-3 font-medium text-zinc-400">Brand</th>
            <th className="text-center px-4 py-3 font-medium text-zinc-400">Content</th>
            <th className="text-center px-4 py-3 font-medium text-zinc-400">Revenue</th>
            <th className="text-center px-4 py-3 font-medium text-zinc-400">Priority</th>
            <th className="text-left px-4 py-3 font-medium text-zinc-400">Status</th>
            <th className="text-right px-4 py-3 font-medium text-zinc-400">Actions</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr
              key={lead.id}
              className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors"
            >
              <td className="px-4 py-3 font-medium">{lead.companyName}</td>
              <td className="px-4 py-3 text-zinc-400">{lead.niche}</td>
              <td className="px-4 py-3 text-indigo-400">{lead.instagramHandle}</td>
              <td className="px-4 py-3 text-center">
                <ScoreBadge score={lead.brandScore} />
              </td>
              <td className="px-4 py-3 text-center">
                <ScoreBadge score={lead.contentScore} />
              </td>
              <td className="px-4 py-3 text-center">
                <ScoreBadge score={lead.revenueScore} />
              </td>
              <td className="px-4 py-3 text-center">
                {isHighOpp(lead) ? (
                  <span className="inline-block bg-orange-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full tracking-wide">
                    HIGH OPP
                  </span>
                ) : (
                  <span className="text-zinc-600">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <select
                  value={lead.status}
                  onChange={(e) => handleStatusChange(lead, e.target.value)}
                  className={`text-xs rounded-full px-3 py-1 border-0 cursor-pointer ${statusColors[lead.status] || statusColors.new} bg-opacity-100`}
                  style={{ appearance: "auto" }}
                >
                  <option value="new">new</option>
                  <option value="contacted">contacted</option>
                  <option value="replied">replied</option>
                  <option value="booked">booked</option>
                  <option value="closed">closed</option>
                </select>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onMessage(lead)}
                    className="text-xs px-3 py-1.5 bg-indigo-600/20 text-indigo-400 rounded-lg hover:bg-indigo-600/30 transition-colors"
                    title="Generate outreach message"
                  >
                    Outreach
                  </button>
                  <button
                    onClick={() => onEdit(lead)}
                    className="text-xs px-3 py-1.5 bg-zinc-800 text-zinc-400 rounded-lg hover:bg-zinc-700 transition-colors"
                    title="Edit lead"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(lead.id)}
                    className="text-xs px-2 py-1.5 text-zinc-600 hover:text-red-400 transition-colors"
                    title="Delete lead"
                  >
                    ✕
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
