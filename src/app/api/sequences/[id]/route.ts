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
  const template = await prisma.sequenceTemplate.findUnique({ where: { id } });
  if (!template || template.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const { name, description, active, steps } = body as {
    name?: string;
    description?: string;
    active?: boolean;
    steps?: { stepNumber: number; subjectTemplate: string; bodyTemplate: string; delayDays: number }[];
  };

  // Update template fields
  const updated = await prisma.sequenceTemplate.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(active !== undefined ? { active } : {}),
    },
  });

  // Replace steps if provided
  if (steps) {
    await prisma.sequenceTemplateStep.deleteMany({ where: { templateId: id } });
    await prisma.sequenceTemplateStep.createMany({
      data: steps.map((s) => ({
        templateId: id,
        stepNumber: s.stepNumber,
        subjectTemplate: s.subjectTemplate,
        bodyTemplate: s.bodyTemplate,
        delayDays: s.delayDays,
      })),
    });
  }

  const result = await prisma.sequenceTemplate.findUnique({
    where: { id },
    include: { steps: { orderBy: { stepNumber: "asc" } } },
  });

  return NextResponse.json(result);
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
  const template = await prisma.sequenceTemplate.findUnique({ where: { id } });
  if (!template || template.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.sequenceTemplate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
