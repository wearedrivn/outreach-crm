import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getUserPlan } from "@/lib/plans";
import { processLeadsForUser } from "@/lib/agent";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plan = await getUserPlan(session.user.id);
  if (!plan.canUseAI) {
    return NextResponse.json(
      { error: "Agent Mode is a Pro feature.", upgrade: true },
      { status: 403 },
    );
  }

  const settings = await prisma.agentSettings.findUnique({
    where: { userId: session.user.id },
  });

  if (!settings?.enabled) {
    return NextResponse.json(
      { error: "Agent Mode is not enabled. Turn it on in settings first." },
      { status: 400 },
    );
  }

  let body: { leadIds?: string[] } = {};
  try {
    body = await request.json();
  } catch {
    // No body is fine — process all new leads
  }

  const result = await processLeadsForUser(session.user.id, settings, body.leadIds);

  return NextResponse.json({ ok: true, result });
}
