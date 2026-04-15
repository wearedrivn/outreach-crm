import crypto from "node:crypto";
import { prisma } from "./db";

const TOKEN_BYTES = 32;
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 min between requests per user
const MAX_ACTIVE_PER_USER = 3;

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Create a password reset token for a user.
 * Returns the raw token (to email) or null if rate-limited.
 * Invalidates any previously issued unused tokens for this user.
 */
export async function createPasswordResetToken(userId: string): Promise<string | null> {
  // Rate limit: most recent active token must be older than window
  const recent = await prisma.passwordResetToken.findFirst({
    where: { userId, usedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (recent && Date.now() - recent.createdAt.getTime() < RATE_LIMIT_WINDOW_MS) {
    return null;
  }

  // Invalidate any prior unused tokens so only one is active
  await prisma.passwordResetToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });

  // Safety cap — if somehow the user has accumulated many tokens, bail out
  const activeCount = await prisma.passwordResetToken.count({
    where: { userId, usedAt: null, expiresAt: { gt: new Date() } },
  });
  if (activeCount >= MAX_ACTIVE_PER_USER) return null;

  const rawToken = crypto.randomBytes(TOKEN_BYTES).toString("base64url");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.passwordResetToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  return rawToken;
}

/**
 * Verify a raw reset token. Returns the userId if valid, else null.
 * Does NOT consume the token.
 */
export async function verifyPasswordResetToken(rawToken: string): Promise<string | null> {
  if (!rawToken || rawToken.length < 16) return null;
  const tokenHash = hashToken(rawToken);

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!record) return null;
  if (record.usedAt) return null;
  if (record.expiresAt.getTime() < Date.now()) return null;

  return record.userId;
}

/**
 * Consume (mark used) a password reset token. Atomic — returns false
 * if the token was already used or expired between verify and consume.
 */
export async function consumePasswordResetToken(rawToken: string): Promise<string | null> {
  const tokenHash = hashToken(rawToken);
  const now = new Date();

  const result = await prisma.passwordResetToken.updateMany({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: now },
    },
    data: { usedAt: now },
  });

  if (result.count === 0) return null;

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { userId: true },
  });
  return record?.userId ?? null;
}
