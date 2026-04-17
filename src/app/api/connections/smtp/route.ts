import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import { verifySmtp } from "@/lib/email-connections";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type SmtpPayload = {
  email: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure?: boolean;
  smtpUser: string;
  smtpPass: string;
  imapHost?: string;
  imapPort?: number;
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.SMTP_ENCRYPTION_KEY) {
    return NextResponse.json(
      { error: "SMTP storage is not configured on the server (SMTP_ENCRYPTION_KEY missing)." },
      { status: 500 },
    );
  }

  let body: SmtpPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const email = body.email?.trim();
  const host = body.smtpHost?.trim();
  const port = Number(body.smtpPort);
  const user = body.smtpUser?.trim();
  const pass = body.smtpPass;
  const secure = body.smtpSecure ?? port === 465;

  if (!email || !host || !port || !user || !pass) {
    return NextResponse.json(
      { error: "email, smtpHost, smtpPort, smtpUser, and smtpPass are required." },
      { status: 400 },
    );
  }

  // Verify the connection before saving so the user gets instant feedback.
  try {
    await verifySmtp({ host, port, secure, user, pass });
  } catch (err) {
    return NextResponse.json(
      { error: `SMTP verification failed: ${(err as Error).message}` },
      { status: 400 },
    );
  }

  const passEnc = encrypt(pass);

  const conn = await prisma.emailConnection.upsert({
    where: {
      userId_provider: {
        userId: session.user.id,
        provider: "smtp",
      },
    },
    create: {
      userId: session.user.id,
      provider: "smtp",
      email,
      status: "active",
      smtpHost: host,
      smtpPort: port,
      smtpSecure: secure,
      smtpUser: user,
      smtpPassEnc: passEnc,
      imapHost: body.imapHost || null,
      imapPort: body.imapPort || null,
    },
    update: {
      email,
      status: "active",
      lastError: null,
      smtpHost: host,
      smtpPort: port,
      smtpSecure: secure,
      smtpUser: user,
      smtpPassEnc: passEnc,
      imapHost: body.imapHost || null,
      imapPort: body.imapPort || null,
    },
    select: { id: true, provider: true, email: true, status: true },
  });

  return NextResponse.json({ ok: true, connection: conn });
}
