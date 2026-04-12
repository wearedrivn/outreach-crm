import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { parseLeadsCSV } from "@/lib/csv";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No CSV file provided." }, { status: 400 });
  }

  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large. Max 2MB." }, { status: 400 });
  }

  const text = await file.text();
  const { leads, errors } = parseLeadsCSV(text);

  if (leads.length === 0) {
    return NextResponse.json(
      {
        error: "No valid leads found in CSV.",
        errors,
      },
      { status: 400 },
    );
  }

  const created = await prisma.lead.createMany({
    data: leads.map((lead) => ({
      ...lead,
      userId: session.user!.id!,
    })),
  });

  return NextResponse.json({
    imported: created.count,
    skipped: errors.length,
    errors: errors.slice(0, 20),
  });
}
