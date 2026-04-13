import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getUserPlan } from "@/lib/plans";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const leads = await prisma.lead.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(leads);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plan = await getUserPlan(session.user.id);
  if (plan.leadCount >= plan.leadLimit) {
    return NextResponse.json(
      { error: `Free plan is limited to ${plan.leadLimit} leads. Upgrade to Pro for unlimited leads.`, upgrade: true },
      { status: 403 },
    );
  }

  const body = await request.json();
  const lead = await prisma.lead.create({
    data: {
      companyName: body.companyName,
      niche: body.niche,
      instagramHandle: body.instagramHandle,
      website: body.website || "",
      brandScore: body.brandScore ?? 5,
      contentScore: body.contentScore ?? 5,
      revenueScore: body.revenueScore ?? 5,
      status: body.status || "new",
      notes: body.notes || "",
      userId: session.user.id,
    },
  });
  return NextResponse.json(lead, { status: 201 });
}
