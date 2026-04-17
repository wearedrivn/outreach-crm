import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";
import { AgentDashboard } from "@/components/agent-dashboard";

export const dynamic = "force-dynamic";

export default async function AgentPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/landing");

  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-10 max-w-5xl mx-auto w-full animate-fade-in">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-10">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Agent Mode
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Your autonomous outreach assistant. Processes leads, generates messages, and sends emails automatically.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-300 transition-colors"
          >
            Back to Dashboard
          </Link>
          <SignOutButton />
        </div>
      </header>
      <AgentDashboard />
    </main>
  );
}
