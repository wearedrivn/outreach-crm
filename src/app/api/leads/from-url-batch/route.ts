import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getUserPlan } from "@/lib/plans";
import { extractLeadFromURL, type ExtractedLead } from "@/lib/url-extract";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

export type BatchResult = {
  url: string;
  status: "success" | "duplicate" | "failed";
  data?: ExtractedLead;
  duplicateOf?: string;
  error?: string;
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plan = await getUserPlan(session.user.id);
  if (!plan.canBulkImport) {
    return NextResponse.json(
      { error: "Bulk URL import is a Pro feature. Upgrade to Pro to unlock it.", upgrade: true },
      { status: 403 },
    );
  }

  let body: { urls: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { urls } = body;
  if (!Array.isArray(urls) || urls.length === 0) {
    return NextResponse.json({ error: "urls array is required." }, { status: 400 });
  }

  // Cap at 5 per batch
  const batch = urls.slice(0, 5);

  // Pre-fetch existing leads for duplicate checking
  const existingLeads = await prisma.lead.findMany({
    where: { userId: session.user.id },
    select: { website: true, instagramHandle: true, companyName: true },
  });

  const existingHostnames = new Set<string>();
  const existingHandles = new Set<string>();
  for (const lead of existingLeads) {
    if (lead.website) {
      try {
        existingHostnames.add(new URL(lead.website).hostname.replace(/^www\./, ""));
      } catch { /* skip */ }
    }
    if (lead.instagramHandle) {
      existingHandles.add(lead.instagramHandle.toLowerCase());
    }
  }

  // Process all URLs in parallel
  const results: BatchResult[] = await Promise.all(
    batch.map(async (rawUrl): Promise<BatchResult> => {
      const url = rawUrl.trim();
      if (!url) return { url: rawUrl, status: "failed", error: "Empty URL" };

      // Check website duplicate before fetching
      try {
        const normalized = url.startsWith("http") ? url : `https://${url}`;
        const hostname = new URL(normalized).hostname.replace(/^www\./, "");
        if (existingHostnames.has(hostname)) {
          const match = existingLeads.find((l) => {
            try {
              return new URL(l.website).hostname.replace(/^www\./, "") === hostname;
            } catch {
              return false;
            }
          });
          return {
            url,
            status: "duplicate",
            duplicateOf: match?.companyName || hostname,
          };
        }
      } catch {
        // URL parsing failed, will fail in extraction
      }

      try {
        const data = await extractLeadFromURL(url);

        // Check Instagram duplicate
        if (data.instagramHandle && existingHandles.has(data.instagramHandle.toLowerCase())) {
          const match = existingLeads.find(
            (l) => l.instagramHandle.toLowerCase() === data.instagramHandle.toLowerCase(),
          );
          return {
            url,
            status: "duplicate",
            duplicateOf: match?.companyName || data.instagramHandle,
            data,
          };
        }

        return { url, status: "success", data };
      } catch (err) {
        return {
          url,
          status: "failed",
          error: (err as Error).message || "Extraction failed",
        };
      }
    }),
  );

  return NextResponse.json({ results });
}
