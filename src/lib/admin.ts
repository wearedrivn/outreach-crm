import { auth } from "./auth";
import { prisma } from "./db";

/**
 * Verify the current session user is an ADMIN.
 * Returns the user record if admin, null otherwise.
 * Always checks the database — never trusts the JWT alone.
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });

  if (!user || user.role !== "ADMIN") return null;
  return user;
}
