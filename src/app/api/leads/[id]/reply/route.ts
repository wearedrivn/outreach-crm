import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead || lead.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Mark lead as replied
  await prisma.lead.update({
    where: { id },
    data: { status: "replied" },
  });

  // Stop any active sequence
  const sequence = await prisma.emailSequence.findUnique({ where: { leadId: id } });
  if (sequence && !sequence.pausedAt && !sequence.completedAt) {
    await prisma.emailSequence.update({
      where: { id: sequence.id },
      data: { pausedAt: new Date() },
    });
  }

  // Log the inbound reply event
  await prisma.emailLog.create({
    data: {
      leadId: id,
      userId: session.user.id,
      subject: "(Reply detected)",
      body: "Lead marked as replied manually.",
      direction: "inbound",
      status: "received",
      receivedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true, status: "replied" });
}
