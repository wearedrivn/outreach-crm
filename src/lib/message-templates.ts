import type { Lead } from "@prisma/client";

export const TEMPLATE_VARIABLES = [
  { key: "company_name", label: "Company name", example: "Atelier Bravé" },
  { key: "niche", label: "Niche", example: "luxury fashion" },
  { key: "instagram_handle", label: "Instagram handle", example: "@atelierbrave" },
  { key: "website", label: "Website", example: "atelierbrave.com" },
  { key: "first_name", label: "First name (from notes)", example: "Sarah" },
  { key: "brand_score", label: "Brand score /10", example: "9" },
  { key: "content_score", label: "Content score /10", example: "4" },
  { key: "revenue_score", label: "Revenue score /10", example: "8" },
  { key: "observation", label: "Observation (auto)", example: "The gap between your brand level and your feed is costing you clients." },
  { key: "improvement", label: "Improvement (auto)", example: "Treat your feed like editorial, not marketing." },
] as const;

type LeadLike = Pick<
  Lead,
  "companyName" | "niche" | "instagramHandle" | "website" | "brandScore" | "contentScore" | "revenueScore" | "notes"
>;

function company(name: string): string {
  return name === name.toUpperCase() && name.length > 2
    ? name.charAt(0) + name.slice(1).toLowerCase()
    : name;
}

function deriveObservation(lead: LeadLike): string {
  const gap = lead.brandScore - lead.contentScore;
  if (gap >= 4) {
    return `Your brand is operating at a level your content does not reflect yet. Scroll ${lead.instagramHandle} and you would never guess this is a ${lead.brandScore}/10 brand.`;
  }
  if (gap >= 2) {
    return `There is a disconnect between the quality of ${company(lead.companyName)} and how it shows up online. Premium clients decide in three seconds whether you are worth their time.`;
  }
  if (lead.contentScore <= 4) {
    return `${company(lead.companyName)} is clearly a premium operation. Your content should make that obvious at first glance.`;
  }
  if (lead.contentScore <= 6) {
    return `Your content is solid, but solid will not position ${company(lead.companyName)} where the revenue potential says it should be.`;
  }
  return `Your content is strong already. The real question is whether it is converting at the level your brand deserves.`;
}

function deriveImprovement(lead: LeadLike): string {
  const n = lead.niche.toLowerCase();

  if (n.includes("fashion") || n.includes("luxury") || n.includes("apparel")) {
    return `Treat your feed like editorial. Every post is a buying decision your audience is making about you, whether you intend it or not.`;
  }
  if (n.includes("coach") || n.includes("consult") || n.includes("mentor")) {
    return `Build authority content that sells certainty. At high ticket offers, the content is the sales process, not the ads around it.`;
  }
  if (n.includes("beauty") || n.includes("skincare") || n.includes("wellness")) {
    return `Lead with narrative, not product shots. The brands dominating this space sell a feeling before they sell a formula.`;
  }
  if (n.includes("interior") || n.includes("architect") || n.includes("design")) {
    return `Let the work speak, but frame it like a magazine would. Craftsmanship deserves content that matches it.`;
  }
  if (n.includes("wealth") || n.includes("finance") || n.includes("capital") || n.includes("invest")) {
    return `Build trust through consistent authoritative presence. High net worth clients vet you online long before they take a meeting.`;
  }
  if (n.includes("real estate") || n.includes("property") || n.includes("realty")) {
    return `Your listings deserve buyers who do not flinch at the price. That starts with how you show up online, not how you run ads.`;
  }
  if (n.includes("fitness") || n.includes("gym") || n.includes("training")) {
    return `Sell identity, not workouts. Your audience is comparing who they would trust with their body, not comparing exercises.`;
  }
  if (n.includes("tech") || n.includes("saas") || n.includes("software")) {
    return `Lead with trust, not features. The content should make the problem undeniable before the demo ever happens.`;
  }
  if (n.includes("food") || n.includes("restaurant") || n.includes("hospitality")) {
    return `Treat content like ambiance. Guests decide where to eat based on what they see, so the feed is the reservation before the reservation.`;
  }

  if (lead.contentScore <= 4) {
    return `Rebuild the feed around three core pillars that pre sell for you. Positioning, proof, and point of view.`;
  }
  return `Tighten the story. Every post should reinforce one thing: why ${company(lead.companyName)} is the obvious choice in ${lead.niche.toLowerCase()}.`;
}

function deriveFirstName(lead: LeadLike): string {
  // Pull first name from notes if it's there in a recognizable pattern
  const notes = lead.notes || "";
  const match = notes.match(/(?:founder|owner|ceo|contact|name)[:\s]+([A-Z][a-z]+)/i);
  if (match) return match[1];
  return "there";
}

export type TemplateVariables = {
  company_name: string;
  niche: string;
  instagram_handle: string;
  website: string;
  first_name: string;
  brand_score: string;
  content_score: string;
  revenue_score: string;
  observation: string;
  improvement: string;
};

export function buildVariables(lead: LeadLike): TemplateVariables {
  return {
    company_name: company(lead.companyName),
    niche: lead.niche,
    instagram_handle: lead.instagramHandle,
    website: lead.website || "",
    first_name: deriveFirstName(lead),
    brand_score: String(lead.brandScore),
    content_score: String(lead.contentScore),
    revenue_score: String(lead.revenueScore),
    observation: deriveObservation(lead),
    improvement: deriveImprovement(lead),
  };
}

/**
 * Render a template body with {{variable}} substitution.
 * Unknown variables are blanked so no templating syntax leaks to the recipient.
 * Cleans up double spaces and trailing whitespace per line.
 */
export function renderTemplate(body: string, variables: TemplateVariables): string {
  const rendered = body.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_match, key: string) => {
    const k = key.toLowerCase() as keyof TemplateVariables;
    if (k in variables) return variables[k];
    return "";
  });

  return rendered
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").replace(/\s+$/, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/* ── Default templates (5) ──────────────────────────── */

export type DefaultTemplate = {
  name: string;
  description: string;
  type: "outreach" | "followup";
  body: string;
};

export const DEFAULT_TEMPLATES: DefaultTemplate[] = [
  {
    name: "Direct observation",
    description: "Short, confident opener that leads with the gap you noticed.",
    type: "outreach",
    body: `I came across {{company_name}} and wanted to be direct.

{{observation}}

{{improvement}}

I build content systems for premium {{niche}} brands that turn a feed into a quiet client acquisition channel. No templates. No trend chasing. Positioning that compounds.

Worth a 15 minute conversation?`,
  },
  {
    name: "The brand gap",
    description: "Acknowledges the brand strength, then names the content disconnect.",
    type: "outreach",
    body: `{{company_name}} has the brand. The product. The positioning.

But scroll {{instagram_handle}} and that story gets diluted. {{observation}}

{{improvement}}

I help brands at your level close that gap. Organically, strategically, without chasing algorithms.

Open to a quick call?`,
  },
  {
    name: "Pattern interrupt",
    description: "Short, sharp, built for busy founders who skim DMs.",
    type: "outreach",
    body: `Quick thought on {{company_name}}.

{{observation}}

The brands winning in {{niche}} right now are not louder. They are more trusted. Content is what builds that trust at scale.

{{improvement}}

Happy to share a few ideas if you are open to it.`,
  },
  {
    name: "Value first",
    description: "Lead with three specific shifts, not a pitch.",
    type: "outreach",
    body: `I spent a few minutes on {{instagram_handle}} this morning. Three specific shifts would change how {{company_name}} shows up to premium clients, without adding to your workload.

{{observation}}

{{improvement}}

Want me to send them over? No call needed.`,
  },
  {
    name: "Two categories",
    description: "Frames the market as two groups and positions the brand in the winning one.",
    type: "outreach",
    body: `There are two kinds of {{niche}} brands online right now.

One posts content. One builds a pipeline.

{{company_name}} has everything it takes to be in the second group. {{observation}}

{{improvement}}

I work with a small number of premium brands each quarter. If that resonates, I would love 15 minutes to walk you through what I would do.`,
  },
];

