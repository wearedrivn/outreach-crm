import crypto from "crypto";
import { prisma } from "./db";

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const COOLDOWN_SECONDS = 60;

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function generateCode(): string {
  const bytes = crypto.randomBytes(4);
  const num = bytes.readUInt32BE(0) % 1_000_000;
  return num.toString().padStart(OTP_LENGTH, "0");
}

/**
 * Create a new OTP for a user. Invalidates any existing active OTPs.
 * Returns the raw code (to be sent via email) or null if rate-limited.
 */
export async function createOtp(userId: string): Promise<string | null> {
  // Rate limit: check if there's a recent OTP created within cooldown
  const recentOtp = await prisma.otp.findFirst({
    where: {
      userId,
      createdAt: { gt: new Date(Date.now() - COOLDOWN_SECONDS * 1000) },
      usedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (recentOtp) {
    return null; // Too soon, rate limited
  }

  // Invalidate all existing unused OTPs for this user
  await prisma.otp.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });

  const code = generateCode();

  await prisma.otp.create({
    data: {
      userId,
      codeHash: hashCode(code),
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    },
  });

  return code;
}

export type VerifyResult =
  | { success: true }
  | { success: false; error: string; locked?: boolean };

/**
 * Verify an OTP code for a user.
 */
export async function verifyOtp(
  userId: string,
  code: string,
): Promise<VerifyResult> {
  const otp = await prisma.otp.findFirst({
    where: {
      userId,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    return { success: false, error: "No active verification code. Please request a new one." };
  }

  // Check if locked out from too many attempts
  if (otp.attempts >= MAX_ATTEMPTS) {
    return {
      success: false,
      error: "Too many failed attempts. Please request a new code.",
      locked: true,
    };
  }

  const valid = hashCode(code) === otp.codeHash;

  if (!valid) {
    // Increment attempts
    await prisma.otp.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });

    const remaining = MAX_ATTEMPTS - otp.attempts - 1;
    if (remaining <= 0) {
      return {
        success: false,
        error: "Too many failed attempts. Please request a new code.",
        locked: true,
      };
    }

    return {
      success: false,
      error: `Invalid code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
    };
  }

  // Mark as used
  await prisma.otp.update({
    where: { id: otp.id },
    data: { usedAt: new Date() },
  });

  return { success: true };
}
