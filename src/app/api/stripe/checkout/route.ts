import { auth } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) {
    console.error("[stripe-checkout] STRIPE_PRO_PRICE_ID is not set");
    return NextResponse.json(
      { error: "Stripe is not configured. Contact support." },
      { status: 500 },
    );
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("[stripe-checkout] STRIPE_SECRET_KEY is not set");
    return NextResponse.json(
      { error: "Stripe is not configured. Contact support." },
      { status: 500 },
    );
  }

  const origin = request.headers.get("origin") || "http://localhost:3000";

  try {
    const checkoutSession = await getStripe().checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: session.user.email,
      metadata: { userId: session.user.id },
      success_url: `${origin}/pricing?success=true`,
      cancel_url: `${origin}/pricing`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    const e = err as Error & { type?: string; statusCode?: number };
    console.error("[stripe-checkout] Failed to create session:", {
      message: e.message,
      type: e.type,
      statusCode: e.statusCode,
    });
    return NextResponse.json(
      { error: e.message || "Failed to create checkout session." },
      { status: 500 },
    );
  }
}
