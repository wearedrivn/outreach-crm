import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Resend webhook events
// See: https://resend.com/docs/dashboard/webhooks/introduction
type ResendWebhookEvent = {
  type: string;
  created_at: string;
  data: {
    email_id?: string;
    from?: string;
    to?: string[] | string;
    subject?: string;
    headers?: { name: string; value: string }[];
    [key: string]: unknown;
  };
};

export async function POST(request: Request) {
  // Verify webhook secret if configured
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (webhookSecret) {
    const svixId = request.headers.get("svix-id");
    const svixTimestamp = request.headers.get("svix-timestamp");
    const svixSignature = request.headers.get("svix-signature");

    // Basic presence check — full Svix verification can be added with the svix package
    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json({ error: "Missing webhook headers" }, { status: 401 });
    }
  }

  let event: ResendWebhookEvent;
  try {
    event = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  console.log(`[email/webhook] Received event: ${event.type}`);

  // Handle email delivery events
  if (event.type === "email.delivered") {
    const emailId = event.data.email_id;
    if (emailId) {
      await prisma.emailLog.updateMany({
        where: { providerMessageId: emailId },
        data: { status: "delivered" },
      });
    }
  }

  // Handle bounce events
  if (event.type === "email.bounced") {
    const emailId = event.data.email_id;
    if (emailId) {
      await prisma.emailLog.updateMany({
        where: { providerMessageId: emailId },
        data: { status: "bounced" },
      });
    }
  }

  // Handle complaint (spam report) — pause sequence and mark unsubscribed
  if (event.type === "email.complained") {
    const emailId = event.data.email_id;
    if (emailId) {
      const log = await prisma.emailLog.findFirst({
        where: { providerMessageId: emailId },
      });
      if (log) {
        await prisma.lead.update({
          where: { id: log.leadId },
          data: { unsubscribed: true },
        });
        const seq = await prisma.emailSequence.findUnique({ where: { leadId: log.leadId } });
        if (seq && !seq.pausedAt) {
          await prisma.emailSequence.update({
            where: { id: seq.id },
            data: { pausedAt: new Date() },
          });
        }
      }
    }
  }

  // Handle inbound email (reply detection)
  // Resend Inbound Emails sends events when replies come in
  if (event.type === "email.received" || event.type === "inbound_email") {
    const fromEmail = event.data.from;
    const subject = event.data.subject || "(Reply)";

    if (fromEmail) {
      // Find the lead by their email
      const leads = await prisma.lead.findMany({
        where: { email: fromEmail },
      });

      for (const lead of leads) {
        // Mark as replied
        if (lead.status !== "replied" && lead.status !== "booked" && lead.status !== "closed") {
          await prisma.lead.update({
            where: { id: lead.id },
            data: { status: "replied" },
          });
        }

        // Stop active sequence
        const seq = await prisma.emailSequence.findUnique({ where: { leadId: lead.id } });
        if (seq && !seq.pausedAt && !seq.completedAt) {
          await prisma.emailSequence.update({
            where: { id: seq.id },
            data: { pausedAt: new Date() },
          });
        }

        // Log inbound
        await prisma.emailLog.create({
          data: {
            leadId: lead.id,
            userId: lead.userId,
            subject,
            body: "Reply received (via webhook)",
            direction: "inbound",
            status: "received",
            receivedAt: new Date(),
          },
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
