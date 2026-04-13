import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// PATCH — update user role
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { role, plan } = body as { role?: string; plan?: string };

  const data: Record<string, unknown> = {};

  if (role !== undefined) {
    if (!["USER", "ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }
    // Prevent removing your own admin role
    if (id === admin.id && role !== "ADMIN") {
      return NextResponse.json(
        { error: "Cannot remove your own admin role." },
        { status: 400 },
      );
    }
    data.role = role;
  }

  if (plan !== undefined) {
    if (!["FREE", "PRO"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
    }
    data.plan = plan;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update." }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, role: true, plan: true },
  });

  return NextResponse.json(user);
}

// DELETE — delete user and all their leads
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  // Prevent self-deletion
  if (id === admin.id) {
    return NextResponse.json(
      { error: "Cannot delete your own account." },
      { status: 400 },
    );
  }

  // Delete leads first, then user
  await prisma.lead.deleteMany({ where: { userId: id } });
  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
