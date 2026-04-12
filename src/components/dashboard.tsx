"use client";

import { useState } from "react";
import type { Lead } from "@prisma/client";
import { LeadsTable } from "./leads-table";
import { LeadForm } from "./lead-form";
import { MessageModal } from "./message-modal";
import { CSVImportModal } from "./csv-import-modal";

type Props = {
  initialLeads: Lead[];
};

export function Dashboard({ initialLeads }: Props) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [messageLead, setMessageLead] = useState<Lead | null>(null);
  const [filterHighOpp, setFilterHighOpp] = useState(false);
  const [showImport, setShowImport] = useState(false);

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
    <div className="animate-slide-up">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFilterHighOpp(!filterHighOpp)}
            className={`text-xs sm:text-sm px-3.5 py-2 rounded-xl font-medium transition-all duration-150 ${
              filterHighOpp
                ? "bg-orange-500/15 text-orange-400 border border-orange-500/25 shadow-[0_0_12px_rgba(249,115,22,0.1)]"
                : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-300"
            }`}
          >
            HIGH OPP{highOppCount > 0 ? ` (${highOppCount})` : ""}
          </button>
          <span className="text-xs text-zinc-600">
            {sorted.length} lead{sorted.length !== 1 && "s"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="text-sm px-3.5 py-2.5 bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-300 font-medium rounded-xl transition-all duration-150 flex items-center gap-1.5"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Import CSV
          </button>
          <button
            onClick={() => {
              setEditingLead(null);
              setShowForm(true);
            }}
            className="text-sm px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-150 shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20"
          >
            + Add Lead
          </button>
        </div>
      </div>

      {/* Empty state */}
      {sorted.length === 0 && !filterHighOpp && (
        <div className="text-center py-20 animate-fade-in">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 mb-5">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-zinc-500">
              <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" d="M12 6v12M6 12h12" />
            </svg>
          </div>
          <p className="text-zinc-400 text-sm font-medium mb-1">No leads yet</p>
          <p className="text-zinc-600 text-sm">
            Add your first lead to start tracking outreach.
          </p>
        </div>
      )}

      {sorted.length === 0 && filterHighOpp && (
        <div className="text-center py-20 animate-fade-in">
          <p className="text-zinc-500 text-sm">
            No high-opportunity leads found.
          </p>
        </div>
      )}

      {sorted.length > 0 && (
        <LeadsTable
          leads={sorted}
          onEdit={handleEdit}
          onMessage={setMessageLead}
          onRefresh={refreshLeads}
        />
      )}

      {showForm && (
        <LeadForm lead={editingLead} onClose={handleFormClose} />
      )}

      {messageLead && (
        <MessageModal lead={messageLead} onClose={() => setMessageLead(null)} />
      )}

      {showImport && (
        <CSVImportModal
          onClose={() => setShowImport(false)}
          onImported={refreshLeads}
        />
      )}
    </div>
  );
}
