import { verifyOtp } from "@/lib/otp";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json();
  const { userId, code } = body as { userId?: string; code?: string };

  if (!userId || !code) {
    return NextResponse.json(
      { error: "User ID and code are required." },
      { status: 400 },
    );
  }

  const trimmedCode = code.trim();
  if (!/^\d{6}$/.test(trimmedCode)) {
    return NextResponse.json(
      { error: "Code must be 6 digits." },
      { status: 400 },
    );
  }

  const result = await verifyOtp(userId, trimmedCode);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error, locked: result.locked },
      { status: result.locked ? 429 : 400 },
    );
  }

  return NextResponse.json({ verified: true });
}
