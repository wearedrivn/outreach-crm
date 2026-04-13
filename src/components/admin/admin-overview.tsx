"use client";

type Stats = {
  totalUsers: number;
  totalLeads: number;
  highOpp: number;
  booked: number;
  closed: number;
  statusMap: Record<string, number>;
  revenueLevels: { high: number; solid: number; moderate: number; early: number };
  nicheBreakdown: [string, number][];
};

function StatCard({
  label,
  value,
  sub,
  color = "text-zinc-100",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5">
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-2xl sm:text-3xl font-semibold tabular-nums tracking-tight ${color}`}>{value}</p>
      {sub && <p className="text-xs text-zinc-600 mt-1">{sub}</p>}
    </div>
  );
}

export function AdminOverview({ stats }: { stats: Stats }) {
  return (
    <div className="space-y-4 animate-slide-up">
      {/* Top cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Total Users" value={stats.totalUsers} />
        <StatCard label="Total Leads" value={stats.totalLeads} />
        <StatCard
          label="High Opportunity"
          value={stats.highOpp}
          color={stats.highOpp > 0 ? "text-orange-400" : "text-zinc-100"}
        />
        <StatCard
          label="Booked"
          value={stats.booked}
          color={stats.booked > 0 ? "text-amber-400" : "text-zinc-100"}
        />
        <StatCard
          label="Closed"
          value={stats.closed}
          color={stats.closed > 0 ? "text-emerald-400" : "text-zinc-100"}
        />
      </div>

      {/* Revenue + niche breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Revenue levels */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">Revenue Levels</p>
          <div className="space-y-3">
            {[
              { label: "High (8-10)", count: stats.revenueLevels.high, color: "bg-emerald-500" },
              { label: "Solid (6-7)", count: stats.revenueLevels.solid, color: "bg-blue-500" },
              { label: "Moderate (4-5)", count: stats.revenueLevels.moderate, color: "bg-amber-500" },
              { label: "Early (<4)", count: stats.revenueLevels.early, color: "bg-zinc-500" },
            ].map((r) => (
              <div key={r.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-zinc-400">{r.label}</span>
                  <span className="text-zinc-500 tabular-nums">{r.count}</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${r.color}`}
                    style={{ width: `${stats.totalLeads > 0 ? Math.max((r.count / stats.totalLeads) * 100, r.count > 0 ? 2 : 0) : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top niches */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">Top Niches</p>
          {stats.nicheBreakdown.length === 0 ? (
            <p className="text-xs text-zinc-600">No leads yet.</p>
          ) : (
            <div className="space-y-2.5">
              {stats.nicheBreakdown.map(([niche, count]) => (
                <div key={niche} className="flex items-center justify-between">
                  <span className="text-sm text-zinc-300">{niche}</span>
                  <span className="text-xs text-zinc-500 tabular-nums">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
