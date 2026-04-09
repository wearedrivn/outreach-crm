import type { Lead } from "@/generated/prisma/client";

type LeadData = Pick<
  Lead,
  "companyName" | "niche" | "instagramHandle" | "brandScore" | "contentScore" | "revenueScore" | "notes"
>;

function isHighOpportunity(lead: LeadData): boolean {
  return lead.brandScore >= 7 && lead.revenueScore >= 7 && lead.contentScore <= 5;
}

function getContentGap(lead: LeadData): string {
  if (lead.contentScore <= 3) return "Your content doesn't reflect the caliber of what you've built.";
  if (lead.contentScore <= 5) return "There's a gap between your brand and how it shows up online.";
  return "Your content is decent — but decent doesn't match what you're selling.";
}

function getNicheAngle(niche: string): string {
  const lower = niche.toLowerCase();
  if (lower.includes("fashion") || lower.includes("luxury"))
    return "In luxury, perception is everything. Your audience decides in seconds.";
  if (lower.includes("coach"))
    return "High-ticket clients buy authority before they buy the offer.";
  if (lower.includes("beauty") || lower.includes("skincare"))
    return "Premium beauty brands win on storytelling, not just product shots.";
  if (lower.includes("interior") || lower.includes("design"))
    return "Your work speaks for itself — but only if the content lets it.";
  if (lower.includes("wealth") || lower.includes("finance") || lower.includes("capital"))
    return "In wealth management, trust is built through presence, not pitches.";
  return "At your level, content isn't optional — it's how premium brands stay top of mind.";
}

const outreachTemplates = [
  (lead: LeadData) =>
    `${getContentGap(lead)}\n\n${getNicheAngle(lead.niche)}\n\nI work with brands like ${lead.companyName} to build organic content systems that match the quality of what they sell. No templates. No trends. Strategy that positions you where you belong.\n\nWorth a 15-minute look at what's possible?`,

  (lead: LeadData) =>
    `I came across ${lead.instagramHandle} and noticed something.\n\n${getContentGap(lead)} ${getNicheAngle(lead.niche)}\n\nI build content ecosystems for premium brands — the kind that turns a feed into a client acquisition channel without ever feeling salesy.\n\nOpen to a quick conversation?`,

  (lead: LeadData) =>
    `${lead.companyName} has the brand. The product. The positioning.\n\nBut scroll your feed and that story gets lost. ${getContentGap(lead)}\n\nI help brands at your level close that gap — organically, strategically, and without chasing algorithms.\n\n15 minutes. I'll show you exactly what I'd change.`,
];

const followUpTemplates = [
  (lead: LeadData) =>
    `Following up on my last message about ${lead.companyName}'s content presence.\n\n${getNicheAngle(lead.niche)} I've mapped out what a content system could look like for you — specific to your niche, not a generic playbook.\n\nHappy to walk through it if you're open.`,

  (lead: LeadData) =>
    `Not here to chase — just wanted to leave this thought:\n\nBrands in the ${lead.niche.toLowerCase()} space that invest in organic content now are building an asset their competitors can't buy later.\n\n${lead.companyName} is positioned to own that space. I'd like to show you how.\n\nStill open to a quick chat?`,

  (lead: LeadData) =>
    `I know your inbox is full. So I'll keep this short.\n\nI looked deeper into ${lead.instagramHandle}. There are 3 specific moves that would shift how ${lead.companyName} shows up online — without adding to your workload.\n\nWant me to send them over?`,
];

export function generateOutreach(lead: LeadData, index?: number): string {
  const i = index ?? Math.floor(Math.random() * outreachTemplates.length);
  return outreachTemplates[i % outreachTemplates.length](lead);
}

export function generateFollowUp(lead: LeadData, index?: number): string {
  const i = index ?? Math.floor(Math.random() * followUpTemplates.length);
  return followUpTemplates[i % followUpTemplates.length](lead);
}

export { isHighOpportunity };
