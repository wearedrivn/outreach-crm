import { prisma } from "@/lib/db";
import { processLeadsForUser } from "@/lib/agent";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allSettings = await prisma.agentSettings.findMany({
    where: { enabled: true },
  });

  const results: { userId: string; result: unknown; error?: string }[] = [];

  for (const settings of allSettings) {
    try {
      const result = await processLeadsForUser(settings.userId, settings);
      results.push({ userId: settings.userId, result });
    } catch (err) {
      results.push({
        userId: settings.userId,
        result: null,
        error: (err as Error).message,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    usersProcessed: allSettings.length,
    results,
    processedAt: new Date().toISOString(),
  });
}
