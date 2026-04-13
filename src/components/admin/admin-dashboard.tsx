"use client";

import { useState, useEffect } from "react";
import { AdminOverview } from "./admin-overview";
import { AdminUsers } from "./admin-users";
import { AdminLeads } from "./admin-leads";
import { AdminActivity } from "./admin-activity";
import { AdminCharts } from "./admin-charts";

type Tab = "overview" | "users" | "leads" | "activity";

type Stats = {
  totalUsers: number;
  totalLeads: number;
  highOpp: number;
  booked: number;
  closed: number;
  statusMap: Record<string, number>;
  revenueLevels: { high: number; solid: number; moderate: number; early: number };
  nicheBreakdown: [string, number][];
  recentUsers: { id: string; name: string; email: string; createdAt: string }[];
  recentLeads: {
    id: string;
    companyName: string;
    niche: string;
    status: string;
    createdAt: string;
    user: { name: string; email: string };
  }[];
  leadsByDay: { date: string; count: number }[];
  usersByDay: { date: string; count: number }[];
};

export function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadStats() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to load stats");
      const data = await res.json();
      setStats(data);
    } catch {
      setError("Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadStats(); }, []);

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "users", label: "Users" },
    { key: "leads", label: "Leads" },
    { key: "activity", label: "Activity" },
  ];

  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-10 max-w-7xl mx-auto w-full animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </a>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Admin</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-400 uppercase tracking-wide">
                Admin
              </span>
            </div>
            <p className="text-zinc-500 text-sm mt-0.5">Platform overview and management.</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-8 border-b border-zinc-800/60 pb-px overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`text-sm px-4 py-2.5 font-medium rounded-t-lg transition-colors whitespace-nowrap ${
              tab === t.key
                ? "text-zinc-100 bg-zinc-900/50 border-b-2 border-indigo-500"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-20">
          <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-zinc-500">Loading admin data...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Content */}
      {stats && !loading && (
        <>
          {tab === "overview" && (
            <div className="space-y-6">
              <AdminOverview stats={stats} />
              <AdminCharts stats={stats} />
            </div>
          )}
          {tab === "users" && <AdminUsers onRefresh={loadStats} />}
          {tab === "leads" && <AdminLeads />}
          {tab === "activity" && <AdminActivity stats={stats} />}
        </>
      )}
    </main>
  );
}
