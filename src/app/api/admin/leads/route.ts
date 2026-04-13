import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const niche = searchParams.get("niche");
  const revenue = searchParams.get("revenue"); // high, solid, moderate, early
  const highOpp = searchParams.get("highOpp");

  // Build where clause
  const where: Record<string, unknown> = {};

  if (status) where.status = status;
  if (niche) where.niche = { contains: niche, mode: "insensitive" };

  if (revenue === "high") where.revenueScore = { gte: 8 };
  else if (revenue === "solid") where.revenueScore = { gte: 6, lt: 8 };
  else if (revenue === "moderate") where.revenueScore = { gte: 4, lt: 6 };
  else if (revenue === "early") where.revenueScore = { lt: 4 };

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      companyName: true,
      niche: true,
      instagramHandle: true,
      brandScore: true,
      contentScore: true,
      revenueScore: true,
      status: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
    },
  });

  // Filter high opp client-side (complex multi-column filter)
  const filtered = highOpp === "true"
    ? leads.filter((l) => l.brandScore >= 7 && l.revenueScore >= 7 && l.contentScore <= 5)
    : leads;

  return NextResponse.json(filtered);
}
