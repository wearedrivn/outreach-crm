import { prisma } from "@/lib/db";
import { createPasswordResetToken } from "@/lib/password-reset";
import { sendPasswordResetEmail } from "@/lib/email";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const GENERIC_OK = { ok: true, message: "If an account exists, we sent you a reset link." };

function getBaseUrl(request: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  const url = new URL(request.url);
  const proto = request.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || url.host;
  return `${proto}://${host}`;
}

export async function POST(request: Request) {
  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const rawEmail = body.email;
  if (typeof rawEmail !== "string" || !rawEmail.includes("@")) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  const email = rawEmail.trim().toLowerCase();
  if (email.length > 254) {
    return NextResponse.json({ error: "Email is too long." }, { status: 400 });
  }

  // Always respond with the generic success message. Never reveal whether
  // the account exists — not via body, not via status code, not via timing.
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (user) {
      const rawToken = await createPasswordResetToken(user.id);
      // rawToken may be null if rate-limited — still return the generic OK.
      if (rawToken) {
        const resetUrl = `${getBaseUrl(request)}/reset-password?token=${encodeURIComponent(rawToken)}`;
        try {
          await sendPasswordResetEmail(user.email, resetUrl);
        } catch (err) {
          console.error("[password-reset/request] Failed to send email:", (err as Error).message);
          // Still return generic OK — don't leak delivery failures.
        }
      }
    }
  } catch (err) {
    console.error("[password-reset/request] Unexpected error:", (err as Error).message);
    // Still return generic OK.
  }

  return NextResponse.json(GENERIC_OK);
}
