import { prisma } from "./db";

export type UserPlan = {
  plan: "free" | "pro";
  leadCount: number;
  leadLimit: number;
  canUseAI: boolean;
  canBulkImport: boolean;
  urlToLeadRemaining: number;
};

const FREE_LEAD_LIMIT = 10;
const FREE_URL_TO_LEAD_LIMIT = 5;

export async function getUserPlan(userId: string): Promise<UserPlan> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      proExpiresAt: true,
      urlToLeadUsage: true,
      _count: { select: { leads: true } },
    },
  });

  if (!user) {
    return {
      plan: "free",
      leadCount: 0,
      leadLimit: FREE_LEAD_LIMIT,
      canUseAI: false,
      canBulkImport: false,
      urlToLeadRemaining: FREE_URL_TO_LEAD_LIMIT,
    };
  }

  // Plan field is the source of truth.
  // If plan is PRO, user has Pro access.
  // If plan is FREE but proExpiresAt is set and in the future, user still has Pro access.
  const isPro =
    user.plan === "PRO" ||
    (user.proExpiresAt !== null && user.proExpiresAt > new Date());

  const leadCount = user._count.leads;

  if (isPro) {
    return {
      plan: "pro",
      leadCount,
      leadLimit: Infinity,
      canUseAI: true,
      canBulkImport: true,
      urlToLeadRemaining: Infinity,
    };
  }

  return {
    plan: "free",
    leadCount,
    leadLimit: FREE_LEAD_LIMIT,
    canUseAI: false,
    canBulkImport: false,
    urlToLeadRemaining: Math.max(0, FREE_URL_TO_LEAD_LIMIT - user.urlToLeadUsage),
  };
}
