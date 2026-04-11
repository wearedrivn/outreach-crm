import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public diagnostic endpoint. Safe to expose: no secrets, no PII.
// Remove or gate once login is confirmed working in production.
export async function GET() {
  const started = Date.now();

  const databaseUrl = process.env.DATABASE_URL || "";
  const authSecret = process.env.AUTH_SECRET || "";
  const nextAuthSecret = process.env.NEXTAUTH_SECRET || "";

  let dbHost = "";
  try {
    dbHost = databaseUrl ? new URL(databaseUrl).host : "";
  } catch {
    dbHost = "INVALID_URL";
  }

  const envReport = {
    DATABASE_URL: {
      present: Boolean(databaseUrl),
      host: dbHost,
      isPooler: dbHost.includes("pooler.supabase.com"),
      hasPgbouncerParam: databaseUrl.includes("pgbouncer=true"),
    },
    AUTH_SECRET: {
      present: Boolean(authSecret),
      length: authSecret.length,
    },
    NEXTAUTH_SECRET: {
      present: Boolean(nextAuthSecret),
      length: nextAuthSecret.length,
    },
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL ?? null,
    VERCEL_ENV: process.env.VERCEL_ENV ?? null,
    VERCEL_URL: process.env.VERCEL_URL ?? null,
  };

  let userCount: number | null = null;
  let dbError: string | null = null;
  let dbMs: number | null = null;

  try {
    const t0 = Date.now();
    userCount = await Promise.race([
      prisma.user.count(),
      new Promise<number>((_, reject) =>
        setTimeout(() => reject(new Error("db_timeout_5s")), 5000)
      ),
    ]);
    dbMs = Date.now() - t0;
  } catch (e) {
    const err = e as Error & { code?: string };
    dbError = `${err.name}: ${err.message}${err.code ? ` (${err.code})` : ""}`;
  }

  return NextResponse.json({
    ok: !dbError && envReport.AUTH_SECRET.present,
    totalMs: Date.now() - started,
    env: envReport,
    db: {
      userCount,
      error: dbError,
      queryMs: dbMs,
    },
  });
}
