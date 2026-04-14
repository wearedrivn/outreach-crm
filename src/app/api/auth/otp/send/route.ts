import { prisma } from "@/lib/db";
import { createOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password } = body as { email?: string; password?: string };

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true, passwordHash: true },
  });

  if (!user) {
    // Don't reveal whether email exists
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  // Generate OTP
  const code = await createOtp(user.id);
  if (!code) {
    return NextResponse.json(
      { error: "Please wait before requesting a new code.", cooldown: true },
      { status: 429 },
    );
  }

  // Send email
  try {
    await sendOtpEmail(user.email, code);
  } catch (err) {
    console.error("[otp/send] Failed to send email:", (err as Error).message);
    return NextResponse.json(
      { error: "Failed to send verification email. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ userId: user.id, sent: true });
}
