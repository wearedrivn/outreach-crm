import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.messageTemplate.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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

  const data: {
    name?: string;
    description?: string;
    body?: string;
    type?: string;
  } = {};

  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name) return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
    data.name = name;
  }
  if (body.description !== undefined) data.description = body.description.trim();
  if (body.body !== undefined) {
    const b = body.body.trim();
    if (!b) return NextResponse.json({ error: "Body cannot be empty." }, { status: 400 });
    data.body = b;
  }
  if (body.type !== undefined) {
    data.type = body.type === "followup" ? "followup" : "outreach";
  }

  const updated = await prisma.messageTemplate.update({
    where: { id },
    data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.messageTemplate.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.messageTemplate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
