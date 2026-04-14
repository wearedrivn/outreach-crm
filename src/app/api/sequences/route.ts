import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sequences = await prisma.sequenceTemplate.findMany({
    where: { userId: session.user.id },
    include: { steps: { orderBy: { stepNumber: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(sequences);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, steps } = body as {
    name: string;
    description?: string;
    steps: { stepNumber: number; subjectTemplate: string; bodyTemplate: string; delayDays: number }[];
  };

  if (!name || !steps || steps.length === 0) {
    return NextResponse.json({ error: "Name and at least one step are required." }, { status: 400 });
  }

  const template = await prisma.sequenceTemplate.create({
    data: {
      userId: session.user.id,
      name,
      description: description || "",
      steps: {
        create: steps.map((s) => ({
          stepNumber: s.stepNumber,
          subjectTemplate: s.subjectTemplate,
          bodyTemplate: s.bodyTemplate,
          delayDays: s.delayDays,
        })),
      },
    },
    include: { steps: { orderBy: { stepNumber: "asc" } } },
  });

  return NextResponse.json(template, { status: 201 });
}
