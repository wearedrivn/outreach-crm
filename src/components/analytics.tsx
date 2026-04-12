"use client";

import type { Lead } from "@prisma/client";

type Props = {
  leads: Lead[];
};

function isHighOpp(l: Lead) {
  return l.brandScore >= 7 && l.revenueScore >= 7 && l.contentScore <= 5;
}

function pct(num: number, den: number): string {
  if (den === 0) return "0";
  return Math.round((num / den) * 100).toString();
}

type StatCardProps = {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
};

function StatCard({ label, value, sub, color = "text-zinc-100" }: StatCardProps) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-4 sm:p-5">
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
        {label}
      </p>
      <p className={`text-2xl sm:text-3xl font-semibold tabular-nums tracking-tight ${color}`}>
        {value}
      </p>
      {sub && (
        <p className="text-xs text-zinc-600 mt-1">{sub}</p>
      )}
    </div>
  );
}

type FunnelStep = {
  label: string;
  count: number;
  color: string;
};

function FunnelBar({ steps, total }: { steps: FunnelStep[]; total: number }) {
  if (total === 0) return null;
  return (
    <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-4 sm:p-5">
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">
        Pipeline
      </p>
      <div className="space-y-3">
        {steps.map((step) => {
          const w = total > 0 ? (step.count / total) * 100 : 0;
          return (
            <div key={step.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-zinc-400 font-medium capitalize">{step.label}</span>
                <span className="text-zinc-500 tabular-nums">
                  {step.count} <span className="text-zinc-700">({pct(step.count, total)}%)</span>
                </span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${step.color}`}
                  style={{ width: `${Math.max(w, w > 0 ? 2 : 0)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Analytics({ leads }: Props) {
  if (leads.length === 0) return null;

  const total = leads.length;
  const highOpp = leads.filter(isHighOpp).length;

  // Status counts
  const byStatus: Record<string, number> = {};
  for (const l of leads) {
    byStatus[l.status] = (byStatus[l.status] || 0) + 1;
  }

  const contacted = (byStatus["contacted"] || 0) + (byStatus["replied"] || 0) + (byStatus["booked"] || 0) + (byStatus["closed"] || 0);
  const replied = (byStatus["replied"] || 0) + (byStatus["booked"] || 0) + (byStatus["closed"] || 0);
  const booked = (byStatus["booked"] || 0) + (byStatus["closed"] || 0);
  const closed = byStatus["closed"] || 0;

  // Conversion rates
  const contactRate = pct(contacted, total);
  const replyRate = contacted > 0 ? pct(replied, contacted) : "0";
  const bookRate = replied > 0 ? pct(booked, replied) : "0";
  const closeRate = booked > 0 ? pct(closed, booked) : "0";

  // Average scores
  const avgBrand = (leads.reduce((s, l) => s + l.brandScore, 0) / total).toFixed(1);
  const avgContent = (leads.reduce((s, l) => s + l.contentScore, 0) / total).toFixed(1);
  const avgRevenue = (leads.reduce((s, l) => s + l.revenueScore, 0) / total).toFixed(1);

  const funnelSteps: FunnelStep[] = [
    { label: "new", count: byStatus["new"] || 0, color: "bg-purple-500" },
    { label: "contacted", count: byStatus["contacted"] || 0, color: "bg-blue-500" },
    { label: "replied", count: byStatus["replied"] || 0, color: "bg-emerald-500" },
    { label: "booked", count: byStatus["booked"] || 0, color: "bg-amber-500" },
    { label: "closed", count: byStatus["closed"] || 0, color: "bg-zinc-400" },
  ];

  return (
    <div className="mb-8 space-y-4 animate-fade-in">
      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Leads"
          value={total}
          sub={`${byStatus["new"] || 0} new`}
        />
        <StatCard
          label="High Opportunity"
          value={highOpp}
          sub={highOpp > 0 ? `${pct(highOpp, total)}% of total` : "None yet"}
          color={highOpp > 0 ? "text-orange-400" : "text-zinc-100"}
        />
        <StatCard
          label="Contact Rate"
          value={`${contactRate}%`}
          sub={`${contacted} of ${total} contacted`}
          color={Number(contactRate) >= 50 ? "text-emerald-400" : "text-zinc-100"}
        />
        <StatCard
          label="Close Rate"
          value={`${closeRate}%`}
          sub={closed > 0 ? `${closed} deal${closed !== 1 ? "s" : ""} closed` : "No closes yet"}
          color={Number(closeRate) >= 30 ? "text-emerald-400" : "text-zinc-100"}
        />
      </div>

      {/* Second row: funnel + conversions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2">
          <FunnelBar steps={funnelSteps} total={total} />
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-4 sm:p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">
            Conversions
          </p>
          <div className="space-y-3">
            <ConversionRow label="Contacted" from="reply" rate={replyRate} />
            <ConversionRow label="Replied" from="book" rate={bookRate} />
            <ConversionRow label="Booked" from="close" rate={closeRate} />
          </div>
          <div className="border-t border-zinc-800/60 mt-4 pt-4">
            <p className="text-xs text-zinc-500 mb-2 font-medium">Avg Scores</p>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-zinc-400">Brand <span className="text-zinc-200 font-semibold tabular-nums">{avgBrand}</span></span>
              <span className="text-zinc-400">Content <span className="text-zinc-200 font-semibold tabular-nums">{avgContent}</span></span>
              <span className="text-zinc-400">Revenue <span className="text-zinc-200 font-semibold tabular-nums">{avgRevenue}</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConversionRow({ label, from, rate }: { label: string; from: string; rate: string }) {
  const n = Number(rate);
  let color = "text-zinc-400";
  if (n >= 50) color = "text-emerald-400";
  else if (n >= 25) color = "text-amber-400";
  else if (n > 0) color = "text-red-400";

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-zinc-400">
        {label} &rarr; {from}
      </span>
      <span className={`text-sm font-semibold tabular-nums ${color}`}>
        {rate}%
      </span>
    </div>
  );
}
