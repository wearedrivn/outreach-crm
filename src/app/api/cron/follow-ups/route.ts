import { prisma } from "@/lib/db";
import { sendOutreachEmail } from "@/lib/email";
import { generateFollowUp } from "@/lib/messages";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Statuses that mean the lead should no longer receive outreach
const SKIP_STATUSES = ["replied", "booked", "closed"];

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  let step2Sent = 0;
  let step3Sent = 0;
  let skipped = 0;

  try {
    // Find sequences where step 2 is due
    const dueStep2 = await prisma.emailSequence.findMany({
      where: {
        currentStep: 1,
        step2SentAt: null,
        step2DueAt: { lte: now },
        pausedAt: null,
      },
      include: {
        lead: true,
      },
    });

    for (const seq of dueStep2) {
      const lead = seq.lead;

      // Skip leads with no email or inactive statuses
      if (!lead.email || SKIP_STATUSES.includes(lead.status)) {
        await prisma.emailSequence.update({
          where: { id: seq.id },
          data: { pausedAt: now },
        });
        skipped++;
        continue;
      }

      try {
        const body = generateFollowUp(lead);
        const subject = `Following up — ${lead.companyName}`;

        const result = await sendOutreachEmail(lead.email, subject, body);

        await prisma.emailLog.create({
          data: {
            leadId: lead.id,
            subject,
            body,
            status: "sent",
            providerMessageId: result.id,
            sequenceStep: 2,
          },
        });

        await prisma.emailSequence.update({
          where: { id: seq.id },
          data: { currentStep: 2, step2SentAt: now },
        });

        step2Sent++;
      } catch (err) {
        console.error(`[cron] Failed step 2 for lead ${lead.id}:`, (err as Error).message);
      }
    }

    // Find sequences where step 3 is due
    const dueStep3 = await prisma.emailSequence.findMany({
      where: {
        currentStep: 2,
        step3SentAt: null,
        step3DueAt: { lte: now },
        pausedAt: null,
      },
      include: {
        lead: true,
      },
    });

    for (const seq of dueStep3) {
      const lead = seq.lead;

      if (!lead.email || SKIP_STATUSES.includes(lead.status)) {
        await prisma.emailSequence.update({
          where: { id: seq.id },
          data: { pausedAt: now },
        });
        skipped++;
        continue;
      }

      try {
        const body = generateFollowUp(lead);
        const subject = `One last thought — ${lead.companyName}`;

        const result = await sendOutreachEmail(lead.email, subject, body);

        await prisma.emailLog.create({
          data: {
            leadId: lead.id,
            subject,
            body,
            status: "sent",
            providerMessageId: result.id,
            sequenceStep: 3,
          },
        });

        await prisma.emailSequence.update({
          where: { id: seq.id },
          data: { currentStep: 3, step3SentAt: now },
        });

        step3Sent++;
      } catch (err) {
        console.error(`[cron] Failed step 3 for lead ${lead.id}:`, (err as Error).message);
      }
    }

    return NextResponse.json({
      ok: true,
      step2Sent,
      step3Sent,
      skipped,
      processedAt: now.toISOString(),
    });
  } catch (err) {
    console.error("[cron] Follow-up job failed:", (err as Error).message);
    return NextResponse.json(
      { error: "Cron job failed." },
      { status: 500 },
    );
  }
}
