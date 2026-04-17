import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.agentSettings.findUnique({
    where: { userId: session.user.id },
  });

  if (!settings) {
    return NextResponse.json({
      enabled: false,
      autoGenerateMsg: true,
      autoSendFirst: false,
      autoEnrollSequence: true,
      highOppOnly: false,
      maxDailySends: 20,
      stopOnReply: true,
    });
  }

  return NextResponse.json({
    enabled: settings.enabled,
    autoGenerateMsg: settings.autoGenerateMsg,
    autoSendFirst: settings.autoSendFirst,
    autoEnrollSequence: settings.autoEnrollSequence,
    highOppOnly: settings.highOppOnly,
    maxDailySends: settings.maxDailySends,
    stopOnReply: settings.stopOnReply,
  });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.enabled === "boolean") data.enabled = body.enabled;
  if (typeof body.autoGenerateMsg === "boolean") data.autoGenerateMsg = body.autoGenerateMsg;
  if (typeof body.autoSendFirst === "boolean") data.autoSendFirst = body.autoSendFirst;
  if (typeof body.autoEnrollSequence === "boolean") data.autoEnrollSequence = body.autoEnrollSequence;
  if (typeof body.highOppOnly === "boolean") data.highOppOnly = body.highOppOnly;
  if (typeof body.stopOnReply === "boolean") data.stopOnReply = body.stopOnReply;
  if (typeof body.maxDailySends === "number") {
    data.maxDailySends = Math.max(1, Math.min(100, Math.round(body.maxDailySends)));
  }

  const settings = await prisma.agentSettings.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...data },
    update: data,
  });

  return NextResponse.json({
    enabled: settings.enabled,
    autoGenerateMsg: settings.autoGenerateMsg,
    autoSendFirst: settings.autoSendFirst,
    autoEnrollSequence: settings.autoEnrollSequence,
    highOppOnly: settings.highOppOnly,
    maxDailySends: settings.maxDailySends,
    stopOnReply: settings.stopOnReply,
  });
}
