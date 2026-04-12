import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Dashboard } from "@/components/dashboard";
import { SignOutButton } from "@/components/sign-out-button";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const leads = await prisma.lead.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

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
        <SignOutButton />
      </header>
      <Dashboard initialLeads={leads} />
    </main>
  );
}
