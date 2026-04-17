import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Dashboard } from "@/components/dashboard";
import { SignOutButton } from "@/components/sign-out-button";
import { getUserPlan } from "@/lib/plans";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();
  if (!session?.user?.id) redirect("/landing");

  const [leads, currentUser] = await Promise.all([
    prisma.lead.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    }),
  ]);

  const isAdmin = currentUser?.role === "ADMIN";
  const plan = await getUserPlan(session.user.id);

  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-10 max-w-7xl mx-auto w-full animate-fade-in">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-10">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Outreach CRM
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Welcome back, {session.user.name}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/templates"
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-300 transition-colors"
          >
            Templates
          </Link>
          <Link
            href="/sequences"
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-300 transition-colors"
          >
            Sequences
          </Link>
          <Link
            href="/connections"
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-300 transition-colors"
          >
            Connections
          </Link>
          <Link
            href="/pricing"
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-300 transition-colors"
          >
            {plan.plan === "pro" ? "Pro" : "Upgrade"}
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 hover:bg-indigo-500/25 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              Admin
            </Link>
          )}
          <SignOutButton />
        </div>
      </header>
      <Dashboard initialLeads={leads} plan={plan} />
    </main>
  );
}
