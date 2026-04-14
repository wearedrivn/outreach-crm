import { prisma } from "@/lib/db";
import { createOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json();
  const { userId } = body as { userId?: string };

  if (!userId) {
    return NextResponse.json(
      { error: "User ID is required." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 },
    );
  }

  const code = await createOtp(user.id);
  if (!code) {
    return NextResponse.json(
      { error: "Please wait before requesting a new code.", cooldown: true },
      { status: 429 },
    );
  }

  try {
    await sendOtpEmail(user.email, code);
  } catch (err) {
    console.error("[otp/resend] Failed to send email:", (err as Error).message);
    return NextResponse.json(
      { error: "Failed to send verification email." },
      { status: 500 },
    );
  }

  return NextResponse.json({ sent: true });
}
