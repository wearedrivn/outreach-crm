import { prisma } from "@/lib/db";
import { consumePasswordResetToken, verifyPasswordResetToken } from "@/lib/password-reset";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { token?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const token = body.token;
  const password = body.password;

  if (typeof token !== "string" || token.length < 16) {
    return NextResponse.json({ error: "Invalid or expired reset link." }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }
  if (password.length > 256) {
    return NextResponse.json({ error: "Password is too long." }, { status: 400 });
  }

  const userId = await consumePasswordResetToken(token);
  if (!userId) {
    return NextResponse.json({ error: "Invalid or expired reset link." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  // Invalidate any other outstanding tokens for this user just to be safe.
  await prisma.passwordResetToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}

// GET lets the reset-password page validate a token before showing the form,
// so expired/invalid links can render a friendly error instead of the form.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ valid: false }, { status: 200 });
  }
  const userId = await verifyPasswordResetToken(token);
  return NextResponse.json({ valid: !!userId });
}
