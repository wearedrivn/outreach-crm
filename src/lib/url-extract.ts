/**
 * Extract lead data from a public website URL.
 * Pure heuristics — no AI, no scraping APIs. Just HTML parsing.
 */

export type ExtractedLead = {
  companyName: string;
  website: string;
  instagramHandle: string;
  niche: string;
  notes: string;
  brandScore: number;
  contentScore: number;
  revenueScore: number;
  contactUrl: string;
  aboutUrl: string;
  premiumSignals: string[];
};

/** Fetch HTML with a 10s timeout and browser-like UA */
export async function fetchHTML(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("xhtml")) {
      throw new Error("URL did not return HTML content.");
    }

    // Read max 500KB to avoid memory issues
    const reader = res.body?.getReader();
    if (!reader) throw new Error("No response body.");

    const chunks: Uint8Array[] = [];
    let totalSize = 0;
    const MAX = 512 * 1024;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      totalSize += value.length;
      if (totalSize > MAX) break;
    }

    reader.cancel();
    const decoder = new TextDecoder("utf-8", { fatal: false });
    return chunks.map((c) => decoder.decode(c, { stream: true })).join("") + decoder.decode();
  } finally {
    clearTimeout(timeout);
  }
}

/* ── Helpers ─────────────────────────────────────────── */

function tag(html: string, tagName: string): string {
  const re = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, "i");
  const m = html.match(re);
  return m ? stripTags(m[1]).trim() : "";
}

function meta(html: string, name: string): string {
  // Match name="..." or property="..."
  const re = new RegExp(
    `<meta[^>]*(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']` +
      `|<meta[^>]*content=["']([^"']*)["'][^>]*(?:name|property)=["']${name}["']`,
    "i",
  );
  const m = html.match(re);
  return (m?.[1] || m?.[2] || "").trim();
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ");
}

function allText(html: string): string {
  // Get body content only
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const body = bodyMatch ? bodyMatch[1] : html;
  return stripTags(body).toLowerCase();
}

function headings(html: string): string[] {
  const results: string[] = [];
  const re = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const text = stripTags(m[1]).trim();
    if (text.length > 2 && text.length < 200) results.push(text);
    if (results.length >= 10) break;
  }
  return results;
}

/* ── Instagram detection ─────────────────────────────── */

function findInstagram(html: string): string {
  // Look for instagram.com links
  const re = /https?:\/\/(?:www\.)?instagram\.com\/([a-zA-Z0-9_.]+)/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const handle = m[1].toLowerCase();
    // Skip generic IG pages
    if (["p", "explore", "reel", "reels", "stories", "accounts", "about"].includes(handle)) continue;
    return `@${handle}`;
  }
  return "";
}

/* ── Link detection (contact, about) ─────────────────── */

function findPageUrl(html: string, baseUrl: string, keywords: string[]): string {
  const re = /<a[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const href = m[1];
    const text = stripTags(m[2]).toLowerCase().trim();
    const hrefLower = href.toLowerCase();

    for (const kw of keywords) {
      if (text === kw || text.includes(kw) || hrefLower.includes(`/${kw}`)) {
        try {
          return new URL(href, baseUrl).href;
        } catch {
          return href;
        }
      }
    }
  }
  return "";
}

/* ── Company name extraction ─────────────────────────── */

function extractCompanyName(html: string, url: string): string {
  // Try og:site_name first
  const siteName = meta(html, "og:site_name");
  if (siteName && siteName.length < 60) return siteName;

  // Try title tag, clean common suffixes
  let title = tag(html, "title");
  if (title) {
    // Remove " - Home", " | Official Site", etc.
    title = title
      .replace(/\s*[|–—-]\s*(home|homepage|official.*|welcome.*)$/i, "")
      .replace(/\s*[|–—-]\s*$/, "")
      .trim();
    if (title.length > 0 && title.length < 80) return title;
  }

  // Fallback: hostname
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host.split(".")[0].charAt(0).toUpperCase() + host.split(".")[0].slice(1);
  } catch {
    return "Unknown";
  }
}

/* ── Niche detection ─────────────────────────────────── */

const NICHE_KEYWORDS: [string, string[]][] = [
  ["Luxury Fashion", ["luxury fashion", "haute couture", "designer collection", "luxury apparel"]],
  ["Fashion", ["fashion", "apparel", "clothing", "streetwear", "boutique"]],
  ["Beauty & Skincare", ["skincare", "beauty", "cosmetics", "skin care", "anti-aging", "serum"]],
  ["Real Estate", ["real estate", "property", "realty", "homes for sale", "listing", "brokerage"]],
  ["Interior Design", ["interior design", "interiors", "home design", "furnishing"]],
  ["Fitness", ["fitness", "gym", "personal training", "workout", "strength", "coaching program"]],
  ["Coaching", ["coaching", "mentorship", "high-ticket", "life coach", "business coach", "transformation"]],
  ["Consulting", ["consulting", "consultancy", "advisory", "strategy firm"]],
  ["Agency", ["agency", "creative agency", "marketing agency", "digital agency", "branding agency"]],
  ["Wellness", ["wellness", "holistic", "meditation", "mindfulness", "retreats"]],
  ["Hospitality", ["restaurant", "hospitality", "hotel", "resort", "fine dining", "michelin"]],
  ["Jewelry", ["jewelry", "jewellery", "diamonds", "fine jewelry", "watches"]],
  ["Architecture", ["architecture", "architect", "architectural"]],
  ["Photography", ["photography", "photographer", "photo studio", "portrait"]],
  ["SaaS", ["saas", "software", "platform", "app", "dashboard", "automation"]],
  ["Finance", ["wealth management", "financial advisor", "investment", "capital", "private equity"]],
  ["E-commerce", ["shop", "store", "buy now", "add to cart", "free shipping"]],
  ["Healthcare", ["healthcare", "medical", "clinic", "dental", "doctor", "health"]],
  ["Education", ["education", "courses", "learning", "academy", "school", "university"]],
];

function detectNiche(text: string, headingTexts: string[]): string {
  const combined = text + " " + headingTexts.join(" ").toLowerCase();

  let bestNiche = "";
  let bestCount = 0;

  for (const [niche, keywords] of NICHE_KEYWORDS) {
    let count = 0;
    for (const kw of keywords) {
      if (combined.includes(kw)) count++;
    }
    if (count > bestCount) {
      bestCount = count;
      bestNiche = niche;
    }
  }

  return bestNiche || "General";
}

/* ── Premium signals & brand scoring ─────────────────── */

const PREMIUM_KEYWORDS = [
  "luxury", "premium", "bespoke", "exclusive", "curated", "handcrafted",
  "artisan", "elite", "refined", "sophisticated", "high-end", "world-class",
  "award-winning", "5-star", "five-star", "michelin", "concierge",
  "private", "vip", "invitation only", "by appointment",
  "haute", "couture", "atelier", "maison",
];

const REVENUE_KEYWORDS = [
  "global", "international", "worldwide", "locations", "offices",
  "enterprise", "fortune", "portfolio", "clients include",
  "trusted by", "serving", "billion", "million",
  "franchise", "headquarters", "hq",
];

function detectPremiumSignals(text: string, headingTexts: string[]): string[] {
  const combined = text + " " + headingTexts.join(" ").toLowerCase();
  const found: string[] = [];

  for (const kw of PREMIUM_KEYWORDS) {
    if (combined.includes(kw) && !found.includes(kw)) {
      found.push(kw);
    }
  }

  return found.slice(0, 8);
}

function estimateBrandScore(
  premiumSignals: string[],
  html: string,
): number {
  let score = 5;

  // Premium keywords boost
  if (premiumSignals.length >= 5) score += 3;
  else if (premiumSignals.length >= 3) score += 2;
  else if (premiumSignals.length >= 1) score += 1;

  // Custom domain (not free hosting)
  const hasCustomDomain = !html.includes("wordpress.com") &&
    !html.includes("wixsite.com") &&
    !html.includes("squarespace.com") &&
    !html.includes("blogspot.com");
  if (hasCustomDomain) score += 1;

  // og:image present (cares about social presence)
  if (meta(html, "og:image")) score += 1;

  return Math.min(10, Math.max(1, score));
}

function estimateContentScore(html: string): number {
  let score = 5;

  // Has blog/articles section
  const text = allText(html);
  if (text.includes("blog") || text.includes("articles") || text.includes("insights")) score += 1;

  // Has video embeds
  if (html.includes("youtube.com/embed") || html.includes("vimeo.com")) score += 1;

  // Has social links (active social presence)
  const socialLinks = (html.match(/instagram\.com|tiktok\.com|youtube\.com|linkedin\.com/gi) || []).length;
  if (socialLinks >= 3) score += 1;
  else if (socialLinks === 0) score -= 1;

  // Has meta descriptions (SEO awareness)
  if (meta(html, "description")) score += 1;

  return Math.min(10, Math.max(1, score));
}

function estimateRevenueScore(text: string, premiumSignals: string[]): number {
  let score = 5;

  // Revenue/scale keywords
  let revCount = 0;
  for (const kw of REVENUE_KEYWORDS) {
    if (text.includes(kw)) revCount++;
  }
  if (revCount >= 4) score += 3;
  else if (revCount >= 2) score += 2;
  else if (revCount >= 1) score += 1;

  // Premium signals suggest higher-end pricing
  if (premiumSignals.length >= 3) score += 1;

  // E-commerce signals
  if (text.includes("add to cart") || text.includes("buy now") || text.includes("shop now")) score += 1;

  return Math.min(10, Math.max(1, score));
}

/* ── Notes generation ────────────────────────────────── */

function generateNotes(
  headingTexts: string[],
  description: string,
  premiumSignals: string[],
  contactUrl: string,
  aboutUrl: string,
): string {
  const parts: string[] = [];

  if (description) {
    parts.push(`Meta: ${description.slice(0, 120)}${description.length > 120 ? "..." : ""}`);
  }

  if (headingTexts.length > 0) {
    parts.push(`Headlines: ${headingTexts.slice(0, 3).join(" / ")}`);
  }

  if (premiumSignals.length > 0) {
    parts.push(`Premium cues: ${premiumSignals.join(", ")}`);
  }

  if (contactUrl) parts.push(`Contact: ${contactUrl}`);
  if (aboutUrl) parts.push(`About: ${aboutUrl}`);

  return parts.join("\n");
}

/* ── Main extraction function ────────────────────────── */

export async function extractLeadFromURL(rawUrl: string): Promise<ExtractedLead> {
  // Normalize URL
  let url = rawUrl.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  // Validate
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid URL format.");
  }

  if (!parsed.hostname.includes(".")) {
    throw new Error("Invalid domain.");
  }

  const html = await fetchHTML(parsed.href);
  const text = allText(html);
  const headingTexts = headings(html);
  const description = meta(html, "description") || meta(html, "og:description");

  const companyName = extractCompanyName(html, parsed.href);
  const instagramHandle = findInstagram(html);
  const niche = detectNiche(text, headingTexts);
  const premiumSignals = detectPremiumSignals(text, headingTexts);

  const contactUrl = findPageUrl(html, parsed.href, ["contact", "get in touch", "reach us"]);
  const aboutUrl = findPageUrl(html, parsed.href, ["about", "about us", "our story", "who we are"]);

  const brandScore = estimateBrandScore(premiumSignals, html);
  const contentScore = estimateContentScore(html);
  const revenueScore = estimateRevenueScore(text, premiumSignals);

  const notes = generateNotes(headingTexts, description, premiumSignals, contactUrl, aboutUrl);

  return {
    companyName,
    website: parsed.href,
    instagramHandle,
    niche,
    notes,
    brandScore,
    contentScore,
    revenueScore,
    contactUrl,
    aboutUrl,
    premiumSignals,
  };
}
