import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get("leadId");

  if (!leadId) {
    return NextResponse.json(
      { error: "leadId is required." },
      { status: 400 },
    );
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead || lead.userId !== session.user.id) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  const logs = await prisma.emailLog.findMany({
    where: { leadId },
    orderBy: { sentAt: "desc" },
  });

  const sequence = await prisma.emailSequence.findUnique({
    where: { leadId },
  });

  return NextResponse.json({ logs, sequence });
}
