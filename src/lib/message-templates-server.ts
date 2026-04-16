import { prisma } from "./db";
import { DEFAULT_TEMPLATES } from "./message-templates";

/**
 * Seed the five default templates for a user on their first access,
 * unless they already have templates. Idempotent via the User.templatesSeededAt flag.
 */
export async function ensureDefaultTemplates(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { templatesSeededAt: true },
  });
  if (!user || user.templatesSeededAt) return;

  await prisma.$transaction([
    prisma.messageTemplate.createMany({
      data: DEFAULT_TEMPLATES.map((t) => ({
        userId,
        name: t.name,
        description: t.description,
        type: t.type,
        body: t.body,
        isDefault: true,
      })),
    }),
    prisma.user.update({
      where: { id: userId },
      data: { templatesSeededAt: new Date() },
    }),
  ]);
}
