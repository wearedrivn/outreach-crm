import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getUserPlan } from "@/lib/plans";
import { generateOutreach, generateFollowUp } from "@/lib/messages";
import { buildVariables, renderTemplate } from "@/lib/message-templates";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You write short, premium outreach messages for an agency that helps high-end brands grow organically through social media.

Rules:
- 60 to 120 words
- sound confident, sharp, premium
- no hype, no emojis, no generic agency language
- mention the gap between their brand level and their current content execution
- end with a low-friction CTA
- write in first person, founder-to-founder tone
- no subject lines, no greetings like "Hi [name]" — just the message body
- never use words like "leverage", "synergy", "scale", "game-changer", "unlock"`;

const FOLLOW_UP_SYSTEM = `You write short, premium follow-up messages for an agency that helps high-end brands grow organically through social media.

Rules:
- 40 to 80 words
- reference having reached out before without being pushy
- add one new insight or observation about their brand
- sound confident, sharp, premium
- no hype, no emojis, no generic agency language
- end with a low-friction CTA
- write in first person, founder-to-founder tone
- no subject lines, no greetings — just the message body
- never use words like "leverage", "synergy", "scale", "game-changer", "unlock"`;

type RequestBody = {
  leadId: string;
  type: "outreach" | "followup";
  templateId?: string;
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plan = await getUserPlan(session.user.id);
  if (!plan.canUseAI) {
    return NextResponse.json(
      { error: "AI message generation is a Pro feature. Upgrade to Pro to unlock it.", upgrade: true },
      { status: 403 },
    );
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { leadId, type, templateId } = body;
  if (!leadId || !type || !["outreach", "followup"].includes(type)) {
    return NextResponse.json(
      { error: "leadId and type (outreach|followup) are required." },
      { status: 400 },
    );
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead || lead.userId !== session.user.id) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  // ── Custom template path: render user-owned template with variables ──
  if (templateId) {
    const template = await prisma.messageTemplate.findUnique({ where: { id: templateId } });
    if (!template || template.userId !== session.user.id) {
      return NextResponse.json({ error: "Template not found." }, { status: 404 });
    }
    const vars = buildVariables(lead);
    const message = renderTemplate(template.body, vars);
    return NextResponse.json({ message, source: "user-template", templateName: template.name });
  }

  // ── Fallback: use template engine when no API key is set ──
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const message =
      type === "followup" ? generateFollowUp(lead) : generateOutreach(lead);
    return NextResponse.json({ message, source: "template" });
  }

  // ── Claude API path ──
  // Dynamic import so the SDK isn't loaded when not needed
  const { default: Anthropic } = await import("@anthropic-ai/sdk");

  let revenueLevel = "moderate";
  if (lead.revenueScore >= 8) revenueLevel = "high (7-8 figures)";
  else if (lead.revenueScore >= 6) revenueLevel = "solid (mid 6 figures+)";
  else if (lead.revenueScore >= 4) revenueLevel = "moderate";
  else revenueLevel = "early-stage";

  const userPrompt =
    type === "outreach"
      ? `Write one personalized outreach message based on this lead.

Lead:
Company: ${lead.companyName}
Niche: ${lead.niche}
Instagram: ${lead.instagramHandle}
Website: ${lead.website || "not provided"}
Brand score: ${lead.brandScore}/10
Content score: ${lead.contentScore}/10
Revenue level: ${revenueLevel}
Notes: ${lead.notes || "none"}`
      : `Write one personalized follow-up message based on this lead. This is a second touch — reference having reached out before.

Lead:
Company: ${lead.companyName}
Niche: ${lead.niche}
Instagram: ${lead.instagramHandle}
Website: ${lead.website || "not provided"}
Brand score: ${lead.brandScore}/10
Content score: ${lead.contentScore}/10
Revenue level: ${revenueLevel}
Notes: ${lead.notes || "none"}`;

  try {
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      system: type === "outreach" ? SYSTEM_PROMPT : FOLLOW_UP_SYSTEM,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      // Fall back to templates if Claude returns no text
      const message =
        type === "followup" ? generateFollowUp(lead) : generateOutreach(lead);
      return NextResponse.json({ message, source: "template" });
    }

    return NextResponse.json({ message: textBlock.text.trim(), source: "claude" });
  } catch (err) {
    const e = err as Error & { status?: number };
    console.error("[generate-message] Claude API error:", {
      name: e.name,
      message: e.message,
      status: e.status,
    });

    // On any Claude API failure, fall back to templates instead of erroring
    const message =
      type === "followup" ? generateFollowUp(lead) : generateOutreach(lead);
    return NextResponse.json({ message, source: "template" });
  }
}
