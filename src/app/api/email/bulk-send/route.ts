import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getUserPlan } from "@/lib/plans";
import { sendOutreachEmail } from "@/lib/email";
import { getActiveConnection } from "@/lib/email-connections";
import { generateOutreach } from "@/lib/messages";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RequestBody = {
  leadIds: string[];
  skipContacted?: boolean;
  startSequence?: boolean;
};

type SendResult = {
  leadId: string;
  companyName: string;
  status: "sent" | "skipped" | "failed";
  reason?: string;
};

const SKIP_STATUSES = ["replied", "booked", "closed"];
const CHUNK_SIZE = 5;
const DELAY_BETWEEN_SENDS_MS = 500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plan = await getUserPlan(session.user.id);
  if (!plan.canUseAI) {
    return NextResponse.json(
      { error: "Bulk email sending is a Pro feature.", upgrade: true },
      { status: 403 },
    );
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { leadIds, skipContacted = false, startSequence = true } = body;

  if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
    return NextResponse.json(
      { error: "leadIds array is required." },
      { status: 400 },
    );
  }

  const connection = await getActiveConnection(session.user.id);
  if (!connection) {
    return NextResponse.json(
      {
        error: "Connect your email to send directly from the app, or copy each message and send it manually.",
        needsConnection: true,
      },
      { status: 400 },
    );
  }

  if (leadIds.length > 100) {
    return NextResponse.json(
      { error: "Maximum 100 leads per bulk send." },
      { status: 400 },
    );
  }

  // Fetch all leads belonging to this user
  const leads = await prisma.lead.findMany({
    where: {
      id: { in: leadIds },
      userId: session.user.id,
    },
  });

  const leadsById = new Map(leads.map((l) => [l.id, l]));
  const results: SendResult[] = [];

  // Process in chunks
  for (let i = 0; i < leadIds.length; i += CHUNK_SIZE) {
    const chunk = leadIds.slice(i, i + CHUNK_SIZE);

    for (const leadId of chunk) {
      const lead = leadsById.get(leadId);

      if (!lead) {
        results.push({ leadId, companyName: "Unknown", status: "skipped", reason: "Lead not found" });
        continue;
      }

      if (!lead.email) {
        results.push({ leadId, companyName: lead.companyName, status: "skipped", reason: "No email" });
        continue;
      }

      if (lead.unsubscribed) {
        results.push({ leadId, companyName: lead.companyName, status: "skipped", reason: "Unsubscribed" });
        continue;
      }

      if (SKIP_STATUSES.includes(lead.status)) {
        results.push({ leadId, companyName: lead.companyName, status: "skipped", reason: `Status: ${lead.status}` });
        continue;
      }

      if (skipContacted && lead.status === "contacted") {
        results.push({ leadId, companyName: lead.companyName, status: "skipped", reason: "Already contacted" });
        continue;
      }

      try {
        const messageBody = generateOutreach(lead);
        const subject = `Quick thought on ${lead.companyName}`;

        const result = await sendOutreachEmail(session.user.id, lead.email, subject, messageBody);

        await prisma.emailLog.create({
          data: {
            leadId: lead.id,
            userId: session.user.id,
            subject,
            body: messageBody,
            status: "sent",
            providerMessageId: result.id,
            sequenceStep: startSequence ? 1 : null,
          },
        });

        const now = new Date();

        // Update lead
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            lastContactedAt: now,
            ...(lead.status === "new" ? { status: "contacted" } : {}),
          },
        });

        // Start sequence if requested
        if (startSequence) {
          await prisma.emailSequence.upsert({
            where: { leadId: lead.id },
            create: {
              leadId: lead.id,
              currentStep: 1,
              step1SentAt: now,
              step2DueAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
              step3DueAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
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

        results.push({ leadId, companyName: lead.companyName, status: "sent" });
      } catch (err) {
        console.error(`[bulk-send] Failed for ${lead.id}:`, (err as Error).message);
        results.push({ leadId, companyName: lead.companyName, status: "failed", reason: (err as Error).message });
      }

      // Rate limit between sends
      await sleep(DELAY_BETWEEN_SENDS_MS);
    }
  }

  const sent = results.filter((r) => r.status === "sent").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const failed = results.filter((r) => r.status === "failed").length;

  return NextResponse.json({ results, summary: { sent, skipped, failed, total: results.length } });
}
