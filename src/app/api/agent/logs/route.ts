import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 50));
  const cursor = url.searchParams.get("cursor") || undefined;

  const logs = await prisma.agentLog.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = logs.length > limit;
  if (hasMore) logs.pop();

  const todaySends = await prisma.emailLog.count({
    where: {
      userId: session.user.id,
      direction: "outbound",
      sentAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    },
  });

  const queueCount = await prisma.lead.count({
    where: {
      userId: session.user.id,
      status: "new",
      unsubscribed: false,
    },
  });

  return NextResponse.json({
    logs,
    hasMore,
    nextCursor: hasMore ? logs[logs.length - 1]?.id : null,
    stats: { todaySends, queueCount },
  });
}
