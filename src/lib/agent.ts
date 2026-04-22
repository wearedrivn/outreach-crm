import { prisma } from "./db";
import { sendOutreachEmail } from "./email";
import { generateOutreach } from "./messages";
import { isHighOpportunity } from "./messages";
import { getActiveConnection } from "./email-connections";
import type { Lead, AgentSettings } from "@prisma/client";

const SKIP_STATUSES = ["replied", "booked", "closed"];

type AgentResult = {
  processed: number;
  enriched: number;
  emailsFound: number;
  scored: number;
  messagesGenerated: number;
  emailsSent: number;
  sequencesStarted: number;
  skipped: number;
  errors: number;
};

async function log(
  userId: string,
  action: string,
  detail: string,
  status: "success" | "error" = "success",
  leadId?: string,
) {
  await prisma.agentLog.create({
    data: { userId, leadId, action, detail, status },
  });
}

async function countTodaySends(userId: string): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  return prisma.emailLog.count({
    where: {
      userId,
      sentAt: { gte: startOfDay },
      direction: "outbound",
    },
  });
}

export async function processLeadsForUser(
  userId: string,
  settings: AgentSettings,
  leadIds?: string[],
): Promise<AgentResult> {
  const result: AgentResult = {
    processed: 0,
    enriched: 0,
    emailsFound: 0,
    scored: 0,
    messagesGenerated: 0,
    emailsSent: 0,
    sequencesStarted: 0,
    skipped: 0,
    errors: 0,
  };

  const todaySends = await countTodaySends(userId);
  let remainingSends = Math.max(0, settings.maxDailySends - todaySends);

  const whereClause: Record<string, unknown> = {
    userId,
    status: "new",
    unsubscribed: false,
  };
  if (leadIds?.length) {
    whereClause.id = { in: leadIds };
    delete whereClause.status;
  }

  const leads = await prisma.lead.findMany({
    where: whereClause,
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  for (const lead of leads) {
    if (SKIP_STATUSES.includes(lead.status)) {
      result.skipped++;
      continue;
    }

    if (settings.stopOnReply && lead.status === "replied") {
      result.skipped++;
      await log(userId, "skipped", `${lead.companyName}: already replied`, "success", lead.id);
      continue;
    }

    if (lead.status === "contacted" && !leadIds) {
      result.skipped++;
      continue;
    }

    result.processed++;

    try {
      await processOneLead(userId, lead, settings, result, remainingSends);
      if (result.emailsSent > 0) {
        remainingSends = Math.max(0, remainingSends - 1);
      }
    } catch (err) {
      result.errors++;
      await log(
        userId,
        "error",
        `${lead.companyName}: ${(err as Error).message}`.slice(0, 500),
        "error",
        lead.id,
      );
    }
  }

  return result;
}

async function processOneLead(
  userId: string,
  lead: Lead,
  settings: AgentSettings,
  result: AgentResult,
  remainingSends: number,
) {
  const hasScores = lead.brandScore !== 5 || lead.contentScore !== 5 || lead.revenueScore !== 5;

  if (hasScores) {
    await log(userId, "score_calculated", `${lead.companyName}: B${lead.brandScore} C${lead.contentScore} R${lead.revenueScore}`, "success", lead.id);
    result.scored++;
  }

  if (lead.email) {
    await log(userId, "email_found", `${lead.companyName}: ${lead.email}`, "success", lead.id);
    result.emailsFound++;
  }

  const highOpp = isHighOpportunity(lead);
  if (settings.highOppOnly && !highOpp) {
    result.skipped++;
    await log(userId, "skipped", `${lead.companyName}: not high opportunity (B${lead.brandScore} C${lead.contentScore} R${lead.revenueScore})`, "success", lead.id);
    return;
  }

  if (!lead.email) {
    await log(userId, "skipped", `${lead.companyName}: no email address`, "success", lead.id);
    result.skipped++;
    return;
  }

  if (!settings.autoGenerateMsg) {
    await log(userId, "skipped", `${lead.companyName}: auto-generate disabled`, "success", lead.id);
    return;
  }

  const message = generateOutreach(lead);
  const subject = `Quick thought on ${lead.companyName}`;
  result.messagesGenerated++;
  await log(userId, "message_generated", `${lead.companyName}: outreach message ready`, "success", lead.id);

  if (!settings.autoSendFirst) {
    await log(userId, "skipped", `${lead.companyName}: auto-send disabled, message generated only`, "success", lead.id);
    return;
  }

  if (remainingSends <= 0) {
    await log(userId, "skipped", `${lead.companyName}: daily send limit reached (${settings.maxDailySends})`, "success", lead.id);
    result.skipped++;
    return;
  }

  const conn = await getActiveConnection(userId);
  if (!conn) {
    await log(userId, "skipped", `${lead.companyName}: no email connected, message ready to copy and send manually`, "success", lead.id);
    result.skipped++;
    return;
  }

  try {
    const sendResult = await sendOutreachEmail(userId, lead.email, subject, message);
    result.emailsSent++;

    await prisma.emailLog.create({
      data: {
        leadId: lead.id,
        userId,
        subject,
        body: message,
        status: "sent",
        providerMessageId: sendResult.id,
        sequenceStep: settings.autoEnrollSequence ? 1 : null,
      },
    });

    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        lastContactedAt: new Date(),
        ...(lead.status === "new" ? { status: "contacted" } : {}),
      },
    });

    await log(userId, "email_sent", `${lead.companyName}: sent via ${sendResult.via}`, "success", lead.id);

    if (settings.autoEnrollSequence) {
      const now = new Date();
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
      result.sequencesStarted++;
      await log(userId, "sequence_started", `${lead.companyName}: enrolled in follow-up sequence`, "success", lead.id);
    }
  } catch (err) {
    result.errors++;
    await log(userId, "email_failed", `${lead.companyName}: ${(err as Error).message}`.slice(0, 500), "error", lead.id);
  }
}
