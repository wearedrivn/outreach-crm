import { requireAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/");

  return <AdminDashboard />;
}
