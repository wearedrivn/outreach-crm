import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connections = await prisma.emailConnection.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      provider: true,
      email: true,
      status: true,
      lastError: true,
      smtpHost: true,
      smtpPort: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    connections,
    config: {
      gmail: Boolean(process.env.GMAIL_OAUTH_CLIENT_ID && process.env.GMAIL_OAUTH_CLIENT_SECRET),
      outlook: Boolean(process.env.OUTLOOK_OAUTH_CLIENT_ID && process.env.OUTLOOK_OAUTH_CLIENT_SECRET),
      smtp: Boolean(process.env.SMTP_ENCRYPTION_KEY),
    },
  });
}
