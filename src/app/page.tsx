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
    <main className="flex-1 px-6 py-8 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Outreach CRM
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Welcome back, {session.user.name}.
          </p>
        </div>
        <SignOutButton />
      </div>
      <Dashboard initialLeads={leads} />
    </main>
  );
}
