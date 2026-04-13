"use client";

type Stats = {
  recentUsers: { id: string; name: string; email: string; createdAt: string }[];
  recentLeads: {
    id: string;
    companyName: string;
    niche: string;
    status: string;
    createdAt: string;
    user: { name: string; email: string };
  }[];
};

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function AdminActivity({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-slide-up">
      {/* Recent signups */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">
          Recent Signups
        </p>
        {stats.recentUsers.length === 0 ? (
          <p className="text-xs text-zinc-600 py-4 text-center">No recent signups.</p>
        ) : (
          <div className="space-y-3">
            {stats.recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm text-zinc-200 truncate">{user.name}</p>
                  <p className="text-xs text-zinc-500 font-mono truncate">{user.email}</p>
                </div>
                <span className="text-[11px] text-zinc-600 shrink-0 ml-3">
                  {timeAgo(user.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent leads */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">
          Recent Leads Created
        </p>
        {stats.recentLeads.length === 0 ? (
          <p className="text-xs text-zinc-600 py-4 text-center">No recent leads.</p>
        ) : (
          <div className="space-y-3">
            {stats.recentLeads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm text-zinc-200 truncate">{lead.companyName}</p>
                  <p className="text-xs text-zinc-500 truncate">
                    {lead.niche} &middot; by {lead.user.name}
                  </p>
                </div>
                <span className="text-[11px] text-zinc-600 shrink-0 ml-3">
                  {timeAgo(lead.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
