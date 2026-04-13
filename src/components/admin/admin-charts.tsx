"use client";

type Stats = {
  statusMap: Record<string, number>;
  revenueLevels: { high: number; solid: number; moderate: number; early: number };
  totalLeads: number;
  leadsByDay: { date: string; count: number }[];
  usersByDay: { date: string; count: number }[];
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-purple-500",
  contacted: "bg-blue-500",
  replied: "bg-emerald-500",
  booked: "bg-amber-500",
  closed: "bg-zinc-400",
};

function BarChart({
  data,
  label,
  color = "bg-indigo-500",
}: {
  data: { date: string; count: number }[];
  label: string;
  color?: string;
}) {
  if (data.length === 0) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">{label}</p>
        <p className="text-xs text-zinc-600 py-8 text-center">No data in the last 30 days.</p>
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5">
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">{label}</p>
      <div className="flex items-end gap-[2px] h-28">
        {data.map((d, i) => {
          const h = (d.count / max) * 100;
          const dateStr = new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
          return (
            <div key={i} className="flex-1 flex flex-col items-center group relative">
              <div
                className={`w-full min-w-[4px] rounded-t ${color} transition-all duration-300 opacity-70 hover:opacity-100`}
                style={{ height: `${Math.max(h, d.count > 0 ? 4 : 0)}%` }}
              />
              <div className="hidden group-hover:block absolute -top-8 bg-zinc-800 text-zinc-200 text-[10px] px-2 py-1 rounded-lg whitespace-nowrap z-10 shadow-lg">
                {dateStr}: {d.count}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-zinc-600 mt-2">
        <span>{new Date(data[0].date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        <span>{new Date(data[data.length - 1].date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
      </div>
    </div>
  );
}

function DonutChart({
  segments,
  label,
  total,
}: {
  segments: { name: string; count: number; color: string }[];
  label: string;
  total: number;
}) {
  if (total === 0) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">{label}</p>
        <p className="text-xs text-zinc-600 py-8 text-center">No data yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5">
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">{label}</p>
      {/* Horizontal stacked bar as simple "donut" alternative */}
      <div className="h-4 bg-zinc-800 rounded-full overflow-hidden flex mb-4">
        {segments.map((seg) => {
          const w = (seg.count / total) * 100;
          if (w === 0) return null;
          return (
            <div
              key={seg.name}
              className={`h-full ${seg.color} transition-all duration-500`}
              style={{ width: `${w}%` }}
              title={`${seg.name}: ${seg.count}`}
            />
          );
        })}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {segments.map((seg) => (
          <div key={seg.name} className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${seg.color} shrink-0`} />
            <span className="text-xs text-zinc-400 capitalize">{seg.name}</span>
            <span className="text-xs text-zinc-600 tabular-nums ml-auto">{seg.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminCharts({ stats }: { stats: Stats }) {
  const statusSegments = [
    { name: "new", count: stats.statusMap["new"] || 0, color: STATUS_COLORS.new },
    { name: "contacted", count: stats.statusMap["contacted"] || 0, color: STATUS_COLORS.contacted },
    { name: "replied", count: stats.statusMap["replied"] || 0, color: STATUS_COLORS.replied },
    { name: "booked", count: stats.statusMap["booked"] || 0, color: STATUS_COLORS.booked },
    { name: "closed", count: stats.statusMap["closed"] || 0, color: STATUS_COLORS.closed },
  ];

  const revenueSegments = [
    { name: "high (8-10)", count: stats.revenueLevels.high, color: "bg-emerald-500" },
    { name: "solid (6-7)", count: stats.revenueLevels.solid, color: "bg-blue-500" },
    { name: "moderate (4-5)", count: stats.revenueLevels.moderate, color: "bg-amber-500" },
    { name: "early (<4)", count: stats.revenueLevels.early, color: "bg-zinc-500" },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Status + Revenue distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <DonutChart segments={statusSegments} label="Leads by Status" total={stats.totalLeads} />
        <DonutChart segments={revenueSegments} label="Leads by Revenue Level" total={stats.totalLeads} />
      </div>

      {/* Time series */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <BarChart data={stats.leadsByDay} label="Leads Created (30 days)" color="bg-indigo-500" />
        <BarChart data={stats.usersByDay} label="User Signups (30 days)" color="bg-emerald-500" />
      </div>
    </div>
  );
}
