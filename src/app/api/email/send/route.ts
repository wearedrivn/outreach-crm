import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getUserPlan } from "@/lib/plans";
import { sendOutreachEmail } from "@/lib/email";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RequestBody = {
  leadId: string;
  subject: string;
  body: string;
  startSequence?: boolean;
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plan = await getUserPlan(session.user.id);
  if (!plan.canUseAI) {
    return NextResponse.json(
      { error: "Email sending is a Pro feature.", upgrade: true },
      { status: 403 },
    );
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { leadId, subject, body: emailBody, startSequence } = body;

  if (!leadId || !subject || !emailBody) {
    return NextResponse.json(
      { error: "leadId, subject, and body are required." },
      { status: 400 },
    );
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead || lead.userId !== session.user.id) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  if (!lead.email) {
    return NextResponse.json(
      { error: "This lead has no email address. Add one first." },
      { status: 400 },
    );
  }

  try {
    const result = await sendOutreachEmail(lead.email, subject, emailBody);

    const emailLog = await prisma.emailLog.create({
      data: {
        leadId: lead.id,
        userId: session.user.id,
        subject,
        body: emailBody,
        status: "sent",
        providerMessageId: result.id,
        sequenceStep: startSequence ? 1 : null,
      },
    });

    // Update lead status and lastContactedAt
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        lastContactedAt: new Date(),
        ...(lead.status === "new" ? { status: "contacted" } : {}),
      },
    });

    // Start email sequence if requested
    if (startSequence) {
      const now = new Date();
      await prisma.emailSequence.upsert({
        where: { leadId: lead.id },
        create: {
          leadId: lead.id,
          currentStep: 1,
          step1SentAt: now,
          step2DueAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // +3 days
          step3DueAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // +7 days
        },
        update: {
          currentStep: 1,
          startedAt: now,
          pausedAt: null,
          step1SentAt: now,
          step2SentAt: null,
          step2DueAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
          step3SentAt: null,
          step3DueAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    }

    return NextResponse.json({ sent: true, emailLogId: emailLog.id });
  } catch (err) {
    console.error("[email/send] Failed:", (err as Error).message);
    return NextResponse.json(
      { error: "Failed to send email. Please try again." },
      { status: 500 },
    );
  }
}
