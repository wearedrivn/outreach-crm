import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [
    totalUsers,
    totalLeads,
    statusCounts,
    recentUsers,
    recentLeads,
    leadsByDay,
    usersByDay,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.lead.count(),
    prisma.lead.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        companyName: true,
        niche: true,
        status: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
    // Leads created per day (last 30 days)
    prisma.$queryRaw`
      SELECT DATE("createdAt") as date, COUNT(*)::int as count
      FROM "Lead"
      WHERE "createdAt" > NOW() - INTERVAL '30 days'
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    ` as Promise<{ date: string; count: number }[]>,
    // User signups per day (last 30 days)
    prisma.$queryRaw`
      SELECT DATE("createdAt") as date, COUNT(*)::int as count
      FROM "User"
      WHERE "createdAt" > NOW() - INTERVAL '30 days'
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    ` as Promise<{ date: string; count: number }[]>,
  ]);

  // High-opp and revenue breakdown from all leads
  const allLeads = await prisma.lead.findMany({
    select: {
      brandScore: true,
      contentScore: true,
      revenueScore: true,
      niche: true,
    },
  });

  const highOpp = allLeads.filter(
    (l) => l.brandScore >= 7 && l.revenueScore >= 7 && l.contentScore <= 5,
  ).length;

  // Revenue level breakdown
  const revenueLevels = { high: 0, solid: 0, moderate: 0, early: 0 };
  for (const l of allLeads) {
    if (l.revenueScore >= 8) revenueLevels.high++;
    else if (l.revenueScore >= 6) revenueLevels.solid++;
    else if (l.revenueScore >= 4) revenueLevels.moderate++;
    else revenueLevels.early++;
  }

  // Niche breakdown
  const nicheMap: Record<string, number> = {};
  for (const l of allLeads) {
    nicheMap[l.niche] = (nicheMap[l.niche] || 0) + 1;
  }
  const nicheBreakdown = Object.entries(nicheMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Status map
  const statusMap: Record<string, number> = {};
  for (const s of statusCounts) {
    statusMap[s.status] = s._count.id;
  }

  return NextResponse.json({
    totalUsers,
    totalLeads,
    highOpp,
    booked: statusMap["booked"] || 0,
    closed: statusMap["closed"] || 0,
    statusMap,
    revenueLevels,
    nicheBreakdown,
    recentUsers,
    recentLeads,
    leadsByDay,
    usersByDay,
  });
}
