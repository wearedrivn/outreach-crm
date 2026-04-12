import type { Lead } from "@prisma/client";

type LeadData = Pick<
  Lead,
  | "companyName"
  | "niche"
  | "instagramHandle"
  | "website"
  | "brandScore"
  | "contentScore"
  | "revenueScore"
  | "notes"
>;

/* ── Helpers ─────────────────────────────────────────── */

export function isHighOpportunity(lead: LeadData): boolean {
  return lead.brandScore >= 7 && lead.revenueScore >= 7 && lead.contentScore <= 5;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Sentence-case the company name if it's all-caps */
function company(name: string): string {
  return name === name.toUpperCase() && name.length > 2
    ? name.charAt(0) + name.slice(1).toLowerCase()
    : name;
}

/* ── Content gap lines (keyed on contentScore) ──────── */

function contentGapOpener(lead: LeadData): string {
  const s = lead.contentScore;
  if (s <= 2)
    return pick([
      `Your brand is operating at a level your content doesn't reflect yet.`,
      `Scroll ${lead.instagramHandle} and you'd never guess this is a ${lead.brandScore}/10 brand.`,
      `The gap between what ${company(lead.companyName)} delivers and what your feed communicates is costing you clients.`,
    ]);
  if (s <= 4)
    return pick([
      `There's a disconnect between the quality of ${company(lead.companyName)} and how it shows up online.`,
      `Your content is leaving money on the table — premium clients decide in 3 seconds whether you're worth their time.`,
      `${company(lead.companyName)} is clearly a premium operation. Your content should make that obvious at first glance.`,
    ]);
  if (s <= 6)
    return pick([
      `Your content is solid — but solid won't position ${company(lead.companyName)} where the revenue potential says it should be.`,
      `Good content won't cut it at your level. ${company(lead.companyName)} needs content that closes before the DM does.`,
    ]);
  return `Your content is strong already — the question is whether it's actually converting at the level your brand deserves.`;
}

/* ── Niche-specific authority lines ─────────────────── */

function nicheAuthority(niche: string): string {
  const n = niche.toLowerCase();

  if (n.includes("fashion") || n.includes("luxury") || n.includes("apparel"))
    return pick([
      "In luxury, your feed is your storefront. Every post is a buying decision your audience makes about you.",
      "Premium fashion brands don't compete on product — they compete on perception. Content controls that.",
      "Your audience shops with their eyes first. The brands winning in this space treat their feed like editorial.",
    ]);

  if (n.includes("coach") || n.includes("consult") || n.includes("mentor"))
    return pick([
      "High-ticket clients don't buy coaching — they buy certainty. Your content is how they decide if you're the one.",
      "At $5K+ offers, authority content isn't marketing. It's the sales process.",
      "Your ideal client is scrolling right now, deciding who to trust with their transformation. Your content is your audition.",
    ]);

  if (n.includes("beauty") || n.includes("skincare") || n.includes("wellness"))
    return pick([
      "Premium beauty brands win on narrative, not product shots. The brands dominating this space sell a feeling before a formula.",
      "Your audience has 50 options. The brand with the most compelling story wins — not the best ingredients list.",
    ]);

  if (n.includes("interior") || n.includes("architect") || n.includes("design"))
    return pick([
      "Your work is the proof. But if the content doesn't match the craftsmanship, the right clients never see it.",
      "In design, your portfolio should sell itself — but only if the content does the work of showing it properly.",
    ]);

  if (n.includes("wealth") || n.includes("finance") || n.includes("capital") || n.includes("invest"))
    return pick([
      "In wealth management, trust is built through consistent, authoritative presence — not cold outreach.",
      "HNW clients vet you online before they ever take a meeting. Your content is your first impression and your due diligence.",
    ]);

  if (n.includes("real estate") || n.includes("property") || n.includes("realty"))
    return pick([
      "In luxury real estate, the agent's brand is the listing's brand. Premium content isn't optional — it's expected.",
      "Your listings deserve to be seen by buyers who don't flinch at the price. That starts with how you show up online.",
    ]);

  if (n.includes("fitness") || n.includes("gym") || n.includes("training"))
    return pick([
      "Premium fitness brands don't sell workouts — they sell identity. Your content should make your client feel like the person they want to become.",
      "At your price point, your audience isn't comparing exercises. They're comparing who they'd trust with their body.",
    ]);

  if (n.includes("tech") || n.includes("saas") || n.includes("software"))
    return pick([
      "In SaaS, the brands winning organic aren't louder — they're more trusted. Content builds that trust at scale.",
      "Your product solves a real problem. Your content should make that undeniable before the demo ever happens.",
    ]);

  if (n.includes("food") || n.includes("restaurant") || n.includes("hospitality"))
    return pick([
      "In hospitality, every touchpoint is an experience — including your feed. The best restaurants treat content like ambiance.",
      "Your guests decide where to eat based on what they see. Your content is the reservation before the reservation.",
    ]);

  // Generic high-end fallback
  return pick([
    "At your level, content isn't a nice-to-have. It's the difference between being found and being forgotten.",
    "Premium brands that invest in organic content now are building an asset their competitors can't replicate later.",
    "The brands winning in your space aren't spending more on ads — they're spending smarter on content that compounds.",
  ]);
}

/* ── Revenue-aware urgency lines ────────────────────── */

function revenueUrgency(lead: LeadData): string {
  if (lead.revenueScore >= 8)
    return pick([
      "You're clearly generating revenue. The question is how much more you'd generate if your content matched your offer.",
      "The revenue is there. Now imagine what happens when your content actually pre-sells for you.",
    ]);
  if (lead.revenueScore >= 6)
    return pick([
      "You've built something with real revenue potential. The right content strategy turns that potential into a pipeline.",
      "The foundation is strong. Content is the multiplier that turns steady revenue into compounding growth.",
    ]);
  return "";
}

/* ── Proof/specificity lines based on notes ─────────── */

function notesInsight(lead: LeadData): string {
  if (!lead.notes || lead.notes.trim().length < 5) return "";
  // Pull a short reference to show we've done homework
  const notes = lead.notes.trim();
  if (notes.length > 100) return "";
  return `(I noticed: ${notes} — that context shaped what I'd recommend.)`;
}

/* ── HIGH OPP framing ───────────────────────────────── */

function highOppLine(lead: LeadData): string {
  if (!isHighOpportunity(lead)) return "";
  return pick([
    `Here's what stands out: ${company(lead.companyName)} has the brand strength and the revenue to be a category leader online. The only missing piece is content that matches.`,
    `I rarely reach out — but ${company(lead.companyName)} is exactly the type of brand I built my system for: strong product, strong revenue, underleveraged content.`,
    `I'm selective about who I work with. ${company(lead.companyName)} caught my attention because the brand and revenue are already there — the content just hasn't caught up yet.`,
  ]);
}

/* ── CTA lines ──────────────────────────────────────── */

function outreachCTA(lead: LeadData): string {
  if (isHighOpportunity(lead))
    return pick([
      "I've put together a brief breakdown of what I'd change for your brand. Worth 15 minutes to walk through it?",
      "I have three specific moves I'd make for your content — happy to share them on a quick call.",
      "I'd rather show you than tell you. 15 minutes — I'll walk you through exactly what I'd do for ${company(lead.companyName)}.",
    ]);
  return pick([
    "Worth a quick conversation?",
    "Open to a 15-minute call to see if there's a fit?",
    "Happy to share a few ideas if you're open to it.",
  ]);
}

function followUpCTA(): string {
  return pick([
    "Still open to a quick chat?",
    "Happy to keep this brief — 15 minutes, no pitch, just strategy.",
    "Want me to send over what I'd do? No obligation.",
    "If the timing's off, no worries. But if it's a fit — the window is now.",
  ]);
}

/* ── Outreach templates ─────────────────────────────── */

const outreachTemplates = [
  // Template 1: Lead with the gap
  (lead: LeadData) => {
    const parts = [
      contentGapOpener(lead),
      "",
      nicheAuthority(lead.niche),
      "",
    ];
    const hopp = highOppLine(lead);
    if (hopp) parts.push(hopp, "");
    parts.push(
      `I build content systems for premium brands — the kind that turns your feed into a client acquisition channel without ever feeling like marketing.`,
      "",
      outreachCTA(lead),
    );
    const note = notesInsight(lead);
    if (note) parts.push("", note);
    return parts.join("\n");
  },

  // Template 2: Lead with the brand compliment
  (lead: LeadData) => {
    const parts = [
      `${company(lead.companyName)} has the brand. The product. The positioning.`,
      "",
      `But scroll ${lead.instagramHandle} and that story gets diluted. ${contentGapOpener(lead)}`,
      "",
      nicheAuthority(lead.niche),
    ];
    const rev = revenueUrgency(lead);
    if (rev) parts.push("", rev);
    const hopp = highOppLine(lead);
    if (hopp) parts.push("", hopp);
    parts.push(
      "",
      `I help brands at your level close that gap — organically, strategically, and without chasing algorithms.`,
      "",
      outreachCTA(lead),
    );
    return parts.join("\n");
  },

  // Template 3: Direct and concise
  (lead: LeadData) => {
    const parts = [
      `I came across ${lead.instagramHandle} and wanted to be direct.`,
      "",
      contentGapOpener(lead),
      "",
      nicheAuthority(lead.niche),
    ];
    const hopp = highOppLine(lead);
    if (hopp) parts.push("", hopp);
    parts.push(
      "",
      `I work with a small number of premium brands to build organic content systems that feel like the brand — not like a marketing agency took over.`,
      "",
      `No templates. No trends for the sake of trends. Strategy that positions ${company(lead.companyName)} where it belongs.`,
      "",
      outreachCTA(lead),
    );
    return parts.join("\n");
  },

  // Template 4: Pattern interrupt (short)
  (lead: LeadData) => {
    const parts: string[] = [];
    if (isHighOpportunity(lead)) {
      parts.push(
        `I don't cold DM often. When I do, it's because I see a brand that's leaving significant revenue on the table through content alone.`,
        "",
        `${company(lead.companyName)} is one of those brands.`,
      );
    } else {
      parts.push(
        `Quick thought on ${company(lead.companyName)}:`,
        "",
        contentGapOpener(lead),
      );
    }
    parts.push(
      "",
      nicheAuthority(lead.niche),
      "",
      `I build content strategies for premium brands in the ${lead.niche.toLowerCase()} space. Not posting schedules — positioning systems.`,
      "",
      outreachCTA(lead),
    );
    return parts.join("\n");
  },

  // Template 5: The comparison angle
  (lead: LeadData) => {
    const parts = [
      `There are two types of ${lead.niche.toLowerCase()} brands online right now:`,
      "",
      `1. Brands that post content.`,
      `2. Brands whose content builds a pipeline.`,
      "",
      `${company(lead.companyName)} has everything it takes to be in category 2. ${contentGapOpener(lead)}`,
    ];
    const rev = revenueUrgency(lead);
    if (rev) parts.push("", rev);
    parts.push(
      "",
      `I help premium brands make that shift — no fluff, no busywork, just strategic content that compounds.`,
      "",
      outreachCTA(lead),
    );
    return parts.join("\n");
  },
];

/* ── Follow-up templates ────────────────────────────── */

const followUpTemplates = [
  // Template 1: Value-add follow-up
  (lead: LeadData) =>
    [
      `Following up on my message about ${company(lead.companyName)}'s content.`,
      "",
      `Since then, I've mapped out what a content system would look like for a brand in the ${lead.niche.toLowerCase()} space with your positioning — and there are some clear quick wins.`,
      "",
      nicheAuthority(lead.niche),
      "",
      followUpCTA(),
    ].join("\n"),

  // Template 2: Scarcity + respect
  (lead: LeadData) =>
    [
      `Not here to chase — just wanted to leave this thought:`,
      "",
      `Brands in the ${lead.niche.toLowerCase()} space that invest in strategic content now are building an asset that compounds. The ones that wait are paying more for ads every quarter to stay visible.`,
      "",
      `${company(lead.companyName)} is positioned to own that organic space. I'd like to show you how.`,
      "",
      followUpCTA(),
    ].join("\n"),

  // Template 3: Specific value teaser
  (lead: LeadData) =>
    [
      `I know your inbox is full — so I'll keep this short.`,
      "",
      `I looked deeper into ${lead.instagramHandle}. There are 3 specific shifts that would change how ${company(lead.companyName)} shows up to premium clients — without adding to your workload.`,
      "",
      `Want me to send them over?`,
    ].join("\n"),

  // Template 4: The honest follow-up
  (lead: LeadData) =>
    [
      `Last message from me on this — I respect your time.`,
      "",
      contentGapOpener(lead),
      "",
      `If the timing is right, I'd love 15 minutes to show you what I'd do differently for ${company(lead.companyName)}. If not, no hard feelings.`,
      "",
      `Either way — ${company(lead.companyName)} is a brand I'd genuinely enjoy working with.`,
    ].join("\n"),

  // Template 5: The results angle
  (lead: LeadData) =>
    [
      `Quick follow-up on ${company(lead.companyName)}.`,
      "",
      `The last brand I worked with in the ${lead.niche.toLowerCase()} space saw a 3x increase in inbound inquiries within 60 days — just from restructuring how their content positioned them.`,
      "",
      `${company(lead.companyName)} has stronger fundamentals than they did. I think the results would speak for themselves.`,
      "",
      followUpCTA(),
    ].join("\n"),
];

/* ── Exports ────────────────────────────────────────── */

export function generateOutreach(lead: LeadData, index?: number): string {
  const i = index ?? Math.floor(Math.random() * outreachTemplates.length);
  return outreachTemplates[i % outreachTemplates.length](lead);
}

export function generateFollowUp(lead: LeadData, index?: number): string {
  const i = index ?? Math.floor(Math.random() * followUpTemplates.length);
  return followUpTemplates[i % followUpTemplates.length](lead);
}
