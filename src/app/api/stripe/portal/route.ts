import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("[stripe-portal] STRIPE_SECRET_KEY is not set");
    return NextResponse.json(
      { error: "Stripe is not configured. Contact support." },
      { status: 500 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: "No active subscription" }, { status: 400 });
  }

  const origin = request.headers.get("origin") || "http://localhost:3000";

  try {
    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${origin}/pricing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    const e = err as Error & { type?: string; statusCode?: number };
    console.error("[stripe-portal] Failed to create portal session:", {
      message: e.message,
      type: e.type,
      statusCode: e.statusCode,
    });
    return NextResponse.json(
      { error: e.message || "Failed to create portal session." },
      { status: 500 },
    );
  }
}
