import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generateOutreach, generateFollowUp } from "@/lib/messages";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { leadId, type } = body as { leadId: string; type: "outreach" | "followup" };

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead || lead.userId !== session.user.id) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const message =
    type === "followup" ? generateFollowUp(lead) : generateOutreach(lead);

  return NextResponse.json({ message });
}
