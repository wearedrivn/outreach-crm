export function DashboardMockup() {
  return (
    <div className="relative">
      {/* Indigo glow behind card */}
      <div className="absolute -inset-8 bg-indigo-500/10 rounded-3xl blur-3xl" />

      <div className="relative bg-zinc-900 border border-zinc-800/50 rounded-2xl p-5 shadow-2xl md:rotate-2">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-zinc-400">Recent Leads</span>
          <span className="text-[10px] px-2 py-0.5 bg-indigo-500/15 text-indigo-400 rounded-md font-medium">
            3 new
          </span>
        </div>

        {/* Lead rows */}
        <div className="space-y-2.5">
          <LeadRow name="Studio Noir" brandScore={9} contentScore={3} revenue="high" />
          <LeadRow name="Maison Éclat" brandScore={8} contentScore={4} revenue="high" />
          <LeadRow name="Atelier Luxe" brandScore={7} contentScore={6} revenue="mid" />
          <LeadRow name="Casa Prima" brandScore={6} contentScore={5} revenue="mid" />
        </div>

        {/* Generate button hint */}
        <div className="mt-4 flex justify-end">
          <span className="text-[10px] px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-medium">
            Generate Message
          </span>
        </div>
      </div>
    </div>
  );
}

function LeadRow({
  name,
  brandScore,
  contentScore,
  revenue,
}: {
  name: string;
  brandScore: number;
  contentScore: number;
  revenue: "high" | "mid";
}) {
  return (
    <div className="flex items-center justify-between bg-zinc-800/50 rounded-xl px-3.5 py-2.5">
      <span className="text-sm text-zinc-200 font-medium">{name}</span>
      <div className="flex items-center gap-2">
        <Badge label={`B:${brandScore}`} color={brandScore >= 8 ? "emerald" : "amber"} />
        <Badge label={`C:${contentScore}`} color={contentScore <= 4 ? "emerald" : "zinc"} />
        <span
          className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
            revenue === "high"
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-zinc-700/50 text-zinc-400"
          }`}
        >
          {revenue}
        </span>
      </div>
    </div>
  );
}

function Badge({
  label,
  color,
}: {
  label: string;
  color: "emerald" | "amber" | "zinc";
}) {
  const colors = {
    emerald: "bg-emerald-500/15 text-emerald-400",
    amber: "bg-amber-500/15 text-amber-400",
    zinc: "bg-zinc-700/50 text-zinc-500",
  };
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${colors[color]}`}>
      {label}
    </span>
  );
}
