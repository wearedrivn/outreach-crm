import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BulkImport } from "@/components/bulk-import";

export const dynamic = "force-dynamic";

export default async function BulkImportPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-10 max-w-7xl mx-auto w-full animate-fade-in">
      <header className="flex items-center justify-between mb-8">
        <div>
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
              Bulk URL Import
            </h1>
          </div>
          <p className="text-zinc-500 text-sm ml-8">
            Import multiple websites and turn them into leads.
          </p>
        </div>
      </header>
      <BulkImport />
    </main>
  );
}
