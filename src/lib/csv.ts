/**
 * Minimal CSV parser — handles quoted fields, commas inside quotes,
 * escaped quotes (""), and \r\n / \n line endings. No dependencies.
 */
export function parseCSV(raw: string): Record<string, string>[] {
  const lines = splitRows(raw.trim());
  if (lines.length < 2) return [];

  const headers = parseLine(lines[0]).map((h) => h.trim().toLowerCase());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.every((v) => v.trim() === "")) continue; // skip blank rows
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = (values[j] ?? "").trim();
    }
    rows.push(row);
  }

  return rows;
}

function splitRows(text: string): string[] {
  const rows: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && text[i + 1] === "\n") i++; // skip \r\n
      rows.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current) rows.push(current);
  return rows;
}

function parseLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

/** Header aliases → canonical field names */
const ALIASES: Record<string, string> = {
  company: "companyname",
  "company name": "companyname",
  "company_name": "companyname",
  name: "companyname",
  instagram: "instagramhandle",
  "instagram handle": "instagramhandle",
  "instagram_handle": "instagramhandle",
  handle: "instagramhandle",
  ig: "instagramhandle",
  "brand score": "brandscore",
  "brand_score": "brandscore",
  brand: "brandscore",
  "content score": "contentscore",
  "content_score": "contentscore",
  content: "contentscore",
  "revenue score": "revenuescore",
  "revenue_score": "revenuescore",
  revenue: "revenuescore",
  site: "website",
  url: "website",
  note: "notes",
};

function normalize(key: string): string {
  const lower = key.toLowerCase().trim();
  return ALIASES[lower] ?? lower;
}

export type ParsedLead = {
  companyName: string;
  niche: string;
  instagramHandle: string;
  website: string;
  brandScore: number;
  contentScore: number;
  revenueScore: number;
  status: string;
  notes: string;
};

export type CSVParseResult = {
  leads: ParsedLead[];
  errors: { row: number; message: string }[];
};

function clampScore(val: string): number {
  const n = parseInt(val, 10);
  if (isNaN(n)) return 5;
  return Math.max(1, Math.min(10, n));
}

const VALID_STATUSES = new Set(["new", "contacted", "replied", "booked", "closed"]);

export function parseLeadsCSV(raw: string): CSVParseResult {
  const rows = parseCSV(raw);
  const leads: ParsedLead[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    // Remap keys through aliases
    const mapped: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) {
      mapped[normalize(k)] = v;
    }

    const companyName = mapped["companyname"] || "";
    const niche = mapped["niche"] || "";
    const instagramHandle = mapped["instagramhandle"] || "";

    if (!companyName) {
      errors.push({ row: i + 2, message: "Missing company name" });
      continue;
    }
    if (!niche) {
      errors.push({ row: i + 2, message: `Missing niche for "${companyName}"` });
      continue;
    }
    if (!instagramHandle) {
      errors.push({ row: i + 2, message: `Missing Instagram handle for "${companyName}"` });
      continue;
    }

    const status = (mapped["status"] || "new").toLowerCase();

    leads.push({
      companyName,
      niche,
      instagramHandle: instagramHandle.startsWith("@") ? instagramHandle : `@${instagramHandle}`,
      website: mapped["website"] || "",
      brandScore: clampScore(mapped["brandscore"] || "5"),
      contentScore: clampScore(mapped["contentscore"] || "5"),
      revenueScore: clampScore(mapped["revenuescore"] || "5"),
      status: VALID_STATUSES.has(status) ? status : "new",
      notes: mapped["notes"] || "",
    });
  }

  return { leads, errors };
}
