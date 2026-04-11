"use client";

import { useState } from "react";
import type { Lead } from "@prisma/client";
import { LeadsTable } from "./leads-table";
import { LeadForm } from "./lead-form";
import { MessageModal } from "./message-modal";

type Props = {
  initialLeads: Lead[];
};

export function Dashboard({ initialLeads }: Props) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [messageLead, setMessageLead] = useState<Lead | null>(null);
  const [filterHighOpp, setFilterHighOpp] = useState(false);

  async function refreshLeads() {
    const res = await fetch("/api/leads");
    const data = await res.json();
    setLeads(data);
  }

  function handleEdit(lead: Lead) {
    setEditingLead(lead);
    setShowForm(true);
  }

  function handleFormClose() {
    setShowForm(false);
    setEditingLead(null);
    refreshLeads();
  }

  const isHighOpp = (l: Lead) =>
    l.brandScore >= 7 && l.revenueScore >= 7 && l.contentScore <= 5;

  const displayedLeads = filterHighOpp ? leads.filter(isHighOpp) : leads;

  const sorted = [...displayedLeads].sort((a, b) => {
    const aHigh = isHighOpp(a) ? 1 : 0;
    const bHigh = isHighOpp(b) ? 1 : 0;
    return bHigh - aHigh;
  });

  const highOppCount = leads.filter(isHighOpp).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFilterHighOpp(!filterHighOpp)}
            className={`text-sm px-4 py-2 rounded-lg transition-colors ${
              filterHighOpp
                ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600"
            }`}
          >
            HIGH OPP {highOppCount > 0 && `(${highOppCount})`}
          </button>
          <span className="text-sm text-zinc-500">
            {sorted.length} lead{sorted.length !== 1 && "s"}
          </span>
        </div>
        <button
          onClick={() => {
            setEditingLead(null);
            setShowForm(true);
          }}
          className="text-sm px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
        >
          + Add Lead
        </button>
      </div>

      <LeadsTable
        leads={sorted}
        onEdit={handleEdit}
        onMessage={setMessageLead}
        onRefresh={refreshLeads}
      />

      {showForm && (
        <LeadForm lead={editingLead} onClose={handleFormClose} />
      )}

      {messageLead && (
        <MessageModal lead={messageLead} onClose={() => setMessageLead(null)} />
      )}
    </div>
  );
}
