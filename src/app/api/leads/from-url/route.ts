import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { extractLeadFromURL } from "@/lib/url-extract";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { url: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { url } = body;
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL is required." }, { status: 400 });
  }

  // Check for duplicate by website
  const normalizedUrl = url.trim().toLowerCase().replace(/\/$/, "");
  const existingByWebsite = await prisma.lead.findFirst({
    where: {
      userId: session.user.id,
      website: { contains: new URL(normalizedUrl.startsWith("http") ? normalizedUrl : `https://${normalizedUrl}`).hostname },
    },
  });

  if (existingByWebsite) {
    return NextResponse.json(
      { error: `A lead for this website already exists: ${existingByWebsite.companyName}` },
      { status: 409 },
    );
  }

  try {
    const extracted = await extractLeadFromURL(url);

    // Check for duplicate by Instagram handle
    if (extracted.instagramHandle) {
      const existingByIG = await prisma.lead.findFirst({
        where: {
          userId: session.user.id,
          instagramHandle: extracted.instagramHandle,
        },
      });

      if (existingByIG) {
        return NextResponse.json(
          {
            error: `A lead with Instagram ${extracted.instagramHandle} already exists: ${existingByIG.companyName}`,
            extracted,
          },
          { status: 409 },
        );
      }
    }

    return NextResponse.json({ extracted });
  } catch (err) {
    const e = err as Error;
    console.error("[from-url] Extraction error:", e.message);
    return NextResponse.json(
      { error: e.message || "Failed to extract data from URL." },
      { status: 422 },
    );
  }
}
