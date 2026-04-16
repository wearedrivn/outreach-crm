import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureDefaultTemplates } from "@/lib/message-templates-server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureDefaultTemplates(session.user.id);

  const templates = await prisma.messageTemplate.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(templates);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    name?: string;
    description?: string;
    body?: string;
    type?: "outreach" | "followup";
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name = body.name?.trim();
  const templateBody = body.body?.trim();
  const type = body.type === "followup" ? "followup" : "outreach";

  if (!name || !templateBody) {
    return NextResponse.json(
      { error: "Name and body are required." },
      { status: 400 },
    );
  }

  const template = await prisma.messageTemplate.create({
    data: {
      userId: session.user.id,
      name,
      description: body.description?.trim() || "",
      body: templateBody,
      type,
      isDefault: false,
    },
  });

  return NextResponse.json(template, { status: 201 });
}
