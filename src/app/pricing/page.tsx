import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserPlan } from "@/lib/plans";
import Link from "next/link";
import { PricingCards } from "@/components/pricing-cards";

export const dynamic = "force-dynamic";

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const plan = await getUserPlan(session.user.id);
  const params = await searchParams;
  const showSuccess = params.success === "true";

  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-10 max-w-4xl mx-auto w-full animate-fade-in">
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-1">
          <Link
            href="/"
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Pricing
          </h1>
        </div>
        <p className="text-zinc-500 text-sm ml-8">
          Choose the plan that fits your outreach needs.
        </p>
      </header>

      {showSuccess && (
        <div className="mb-8 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-5 py-4 animate-scale-in">
          Welcome to Pro! You now have unlimited access to all features.
        </div>
      )}

      <PricingCards currentPlan={plan.plan} />
    </main>
  );
}
