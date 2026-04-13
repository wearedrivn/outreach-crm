# Stripe Subscriptions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Free/Pro subscription billing via Stripe so Free users are limited to 10 leads, no AI messages, no bulk import, and 5 URL-to-lead uses, while Pro users (EUR 29/month) get unlimited access.

**Architecture:** Stripe Checkout Sessions handle payment (no embedded forms). Stripe webhooks update subscription state on the User model. A `getUserPlan()` helper is the single source of truth for feature gating, checked in API routes (enforcement) and passed to the client (UX).

**Tech Stack:** Stripe Node SDK (`stripe`), Next.js API routes, Prisma, existing NextAuth auth system.

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `prisma/schema.prisma` | Modify | Add Stripe + usage fields to User |
| `src/lib/stripe.ts` | Create | Stripe client singleton |
| `src/lib/plans.ts` | Create | `getUserPlan()` helper — single source of truth |
| `src/app/api/stripe/checkout/route.ts` | Create | Create Stripe Checkout Session |
| `src/app/api/stripe/portal/route.ts` | Create | Create Stripe Customer Portal session |
| `src/app/api/stripe/webhook/route.ts` | Create | Handle Stripe webhook events |
| `src/app/pricing/page.tsx` | Create | Server component — reads plan, renders cards |
| `src/components/pricing-cards.tsx` | Create | Client component — upgrade/manage buttons |
| `src/proxy.ts` | Modify | Exclude `/api/stripe/webhook` from auth |
| `src/app/api/leads/route.ts` | Modify | Gate lead creation on lead limit |
| `src/app/api/generate-message/route.ts` | Modify | Gate AI messages on `canUseAI` |
| `src/app/api/leads/from-url-batch/route.ts` | Modify | Gate bulk import on `canBulkImport` |
| `src/app/api/leads/from-url/route.ts` | Modify | Gate URL-to-lead on `urlToLeadRemaining`, increment usage |
| `src/app/page.tsx` | Modify | Pass plan info to Dashboard, add Pricing link |
| `src/components/dashboard.tsx` | Modify | Accept plan prop, disable gated buttons |

---

### Task 1: Install Stripe SDK

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the stripe package**

Run:
```bash
npm install stripe
```

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install stripe SDK"
```

---

### Task 2: Database Migration — Add Stripe Fields to User

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add Stripe and usage fields to the User model**

In `prisma/schema.prisma`, add these fields to the `User` model after the `leads` relation:

```prisma
model User {
  id           String   @id @default(cuid())
  name         String
  email        String   @unique
  passwordHash String
  role         Role     @default(USER)
  createdAt    DateTime @default(now())
  leads        Lead[]

  stripeCustomerId       String?   @unique
  stripeSubscriptionId   String?
  stripePriceId          String?
  stripeCurrentPeriodEnd DateTime?
  urlToLeadUsage         Int       @default(0)
}
```

- [ ] **Step 2: Run the migration**

Run:
```bash
npx prisma migrate dev --name add_stripe_fields
```

Expected: Migration succeeds, new columns added to User table.

- [ ] **Step 3: Verify the migration**

Run:
```bash
npx prisma generate
```

Expected: Prisma Client regenerated with new fields.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add Stripe subscription fields to User model"
```

---

### Task 3: Stripe Client Singleton

**Files:**
- Create: `src/lib/stripe.ts`

- [ ] **Step 1: Create the Stripe client**

Create `src/lib/stripe.ts`:

```ts
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
  typescript: true,
});
```

Note: Use the latest API version available. The `apiVersion` string must match what Stripe expects. Check `node_modules/stripe/types/net/net.d.ts` or Stripe docs for the exact version string. If the build fails on the version, use `as Stripe.LatestApiVersion` or omit `apiVersion` to use the SDK default.

- [ ] **Step 2: Commit**

```bash
git add src/lib/stripe.ts
git commit -m "feat: add Stripe client singleton"
```

---

### Task 4: Plan Helper — `getUserPlan()`

**Files:**
- Create: `src/lib/plans.ts`

- [ ] **Step 1: Create the plan helper**

Create `src/lib/plans.ts`:

```ts
import { prisma } from "./db";

export type UserPlan = {
  plan: "free" | "pro";
  leadCount: number;
  leadLimit: number;
  canUseAI: boolean;
  canBulkImport: boolean;
  urlToLeadRemaining: number;
};

const FREE_LEAD_LIMIT = 10;
const FREE_URL_TO_LEAD_LIMIT = 5;

export async function getUserPlan(userId: string): Promise<UserPlan> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      stripeCurrentPeriodEnd: true,
      urlToLeadUsage: true,
      _count: { select: { leads: true } },
    },
  });

  if (!user) {
    return {
      plan: "free",
      leadCount: 0,
      leadLimit: FREE_LEAD_LIMIT,
      canUseAI: false,
      canBulkImport: false,
      urlToLeadRemaining: FREE_URL_TO_LEAD_LIMIT,
    };
  }

  const isPro =
    user.stripeCurrentPeriodEnd !== null &&
    user.stripeCurrentPeriodEnd > new Date();

  const leadCount = user._count.leads;

  if (isPro) {
    return {
      plan: "pro",
      leadCount,
      leadLimit: Infinity,
      canUseAI: true,
      canBulkImport: true,
      urlToLeadRemaining: Infinity,
    };
  }

  return {
    plan: "free",
    leadCount,
    leadLimit: FREE_LEAD_LIMIT,
    canUseAI: false,
    canBulkImport: false,
    urlToLeadRemaining: Math.max(0, FREE_URL_TO_LEAD_LIMIT - user.urlToLeadUsage),
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/plans.ts
git commit -m "feat: add getUserPlan() helper for subscription gating"
```

---

### Task 5: Stripe Checkout API Route

**Files:**
- Create: `src/app/api/stripe/checkout/route.ts`

- [ ] **Step 1: Create the checkout route**

Create `src/app/api/stripe/checkout/route.ts`:

```ts
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const origin = request.headers.get("origin") || "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: session.user.email,
    metadata: { userId: session.user.id },
    success_url: `${origin}/pricing?success=true`,
    cancel_url: `${origin}/pricing`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/stripe/checkout/route.ts
git commit -m "feat: add Stripe Checkout Session API route"
```

---

### Task 6: Stripe Customer Portal API Route

**Files:**
- Create: `src/app/api/stripe/portal/route.ts`

- [ ] **Step 1: Create the portal route**

Create `src/app/api/stripe/portal/route.ts`:

```ts
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: "No active subscription" }, { status: 400 });
  }

  const origin = request.headers.get("origin") || "http://localhost:3000";

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${origin}/pricing`,
  });

  return NextResponse.json({ url: portalSession.url });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/stripe/portal/route.ts
git commit -m "feat: add Stripe Customer Portal API route"
```

---

### Task 7: Stripe Webhook Route

**Files:**
- Create: `src/app/api/stripe/webhook/route.ts`

- [ ] **Step 1: Create the webhook route**

Create `src/app/api/stripe/webhook/route.ts`:

```ts
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("[stripe-webhook] Signature verification failed:", (err as Error).message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (!userId) {
        console.error("[stripe-webhook] No userId in checkout session metadata");
        break;
      }

      // Retrieve the subscription to get period end and price
      const subscriptionId = session.subscription as string;
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      await prisma.user.update({
        where: { id: userId },
        data: {
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: subscriptionId,
          stripePriceId: subscription.items.data[0]?.price.id || null,
          stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      });

      console.log(`[stripe-webhook] User ${userId} subscribed`);
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: {
          stripePriceId: subscription.items.data[0]?.price.id || null,
          stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      });

      console.log(`[stripe-webhook] Subscription updated for customer ${customerId}`);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: {
          stripeSubscriptionId: null,
          stripePriceId: null,
          stripeCurrentPeriodEnd: null,
        },
      });

      console.log(`[stripe-webhook] Subscription deleted for customer ${customerId}`);
      break;
    }

    default:
      // Ignore unhandled event types
      break;
  }

  return NextResponse.json({ received: true });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/stripe/webhook/route.ts
git commit -m "feat: add Stripe webhook handler"
```

---

### Task 8: Update Proxy to Exclude Webhook Route

**Files:**
- Modify: `src/proxy.ts:42-46`

- [ ] **Step 1: Add webhook exclusion to the matcher**

In `src/proxy.ts`, change the `config.matcher` from:

```ts
export const config = {
  matcher: [
    "/((?!login|register|api/auth|api/diag|_next/static|_next/image|favicon.ico).*)",
  ],
};
```

to:

```ts
export const config = {
  matcher: [
    "/((?!login|register|api/auth|api/diag|api/stripe/webhook|_next/static|_next/image|favicon.ico).*)",
  ],
};
```

- [ ] **Step 2: Verify the proxy still builds**

Run:
```bash
npx next build 2>&1 | tail -5
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/proxy.ts
git commit -m "feat: exclude Stripe webhook route from auth proxy"
```

---

### Task 9: Gate Lead Creation

**Files:**
- Modify: `src/app/api/leads/route.ts:20-42` (the POST handler)

- [ ] **Step 1: Add plan check to the POST handler**

In `src/app/api/leads/route.ts`, add the import at the top:

```ts
import { getUserPlan } from "@/lib/plans";
```

Then, inside the `POST` function, after the auth check and before `const body = await request.json();`, add:

```ts
  const plan = await getUserPlan(session.user.id);
  if (plan.leadCount >= plan.leadLimit) {
    return NextResponse.json(
      { error: `Free plan is limited to ${plan.leadLimit} leads. Upgrade to Pro for unlimited leads.`, upgrade: true },
      { status: 403 },
    );
  }
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/leads/route.ts
git commit -m "feat: gate lead creation on plan lead limit"
```

---

### Task 10: Gate AI Message Generation

**Files:**
- Modify: `src/app/api/generate-message/route.ts:38-58` (after auth check, before lead lookup)

- [ ] **Step 1: Add plan check to the POST handler**

In `src/app/api/generate-message/route.ts`, add the import at the top:

```ts
import { getUserPlan } from "@/lib/plans";
```

Then, inside the `POST` function, after the auth check (`if (!session?.user?.id)`) and before `let body: RequestBody;`, add:

```ts
  const plan = await getUserPlan(session.user.id);
  if (!plan.canUseAI) {
    return NextResponse.json(
      { error: "AI message generation is a Pro feature. Upgrade to Pro to unlock it.", upgrade: true },
      { status: 403 },
    );
  }
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/generate-message/route.ts
git commit -m "feat: gate AI message generation on Pro plan"
```

---

### Task 11: Gate Bulk URL Import

**Files:**
- Modify: `src/app/api/leads/from-url-batch/route.ts:17-24` (after auth check)

- [ ] **Step 1: Add plan check to the POST handler**

In `src/app/api/leads/from-url-batch/route.ts`, add the import at the top:

```ts
import { getUserPlan } from "@/lib/plans";
```

Then, inside the `POST` function, after the auth check and before `let body: { urls: string[] };`, add:

```ts
  const plan = await getUserPlan(session.user.id);
  if (!plan.canBulkImport) {
    return NextResponse.json(
      { error: "Bulk URL import is a Pro feature. Upgrade to Pro to unlock it.", upgrade: true },
      { status: 403 },
    );
  }
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/leads/from-url-batch/route.ts
git commit -m "feat: gate bulk URL import on Pro plan"
```

---

### Task 12: Gate URL-to-Lead with Usage Counter

**Files:**
- Modify: `src/app/api/leads/from-url/route.ts:8-18` (after auth check, and after successful extraction)

- [ ] **Step 1: Add plan check and usage increment**

In `src/app/api/leads/from-url/route.ts`, add the imports at the top:

```ts
import { getUserPlan } from "@/lib/plans";
import { prisma } from "@/lib/db";
```

Note: `prisma` is already imported — just add `getUserPlan`.

Then, inside the `POST` function, after the auth check and before `let body: { url: string };`, add:

```ts
  const plan = await getUserPlan(session.user.id);
  if (plan.urlToLeadRemaining <= 0) {
    return NextResponse.json(
      { error: "You've used all 5 free URL-to-lead extractions. Upgrade to Pro for unlimited use.", upgrade: true },
      { status: 403 },
    );
  }
```

Then, after the successful extraction (just before the final `return NextResponse.json({ extracted });` on line ~65), add:

```ts
    // Increment URL-to-lead usage for free users
    if (plan.plan === "free") {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { urlToLeadUsage: { increment: 1 } },
      });
    }
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/leads/from-url/route.ts
git commit -m "feat: gate URL-to-lead on usage limit, increment counter"
```

---

### Task 13: Pricing Page (Server Component)

**Files:**
- Create: `src/app/pricing/page.tsx`

- [ ] **Step 1: Create the pricing page**

Create `src/app/pricing/page.tsx`:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/app/pricing/page.tsx
git commit -m "feat: add pricing page server component"
```

---

### Task 14: Pricing Cards (Client Component)

**Files:**
- Create: `src/components/pricing-cards.tsx`

- [ ] **Step 1: Create the pricing cards component**

Create `src/components/pricing-cards.tsx`:

```tsx
"use client";

import { useState } from "react";

type Props = {
  currentPlan: "free" | "pro";
};

export function PricingCards({ currentPlan }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Something went wrong");
        setLoading(false);
      }
    } catch {
      alert("Network error. Please try again.");
      setLoading(false);
    }
  }

  async function handleManage() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Something went wrong");
        setLoading(false);
      }
    } catch {
      alert("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
      {/* Free plan */}
      <div className={`bg-zinc-900/50 border rounded-2xl p-6 ${currentPlan === "free" ? "border-zinc-700" : "border-zinc-800/80"}`}>
        {currentPlan === "free" && (
          <span className="inline-block text-[10px] font-bold uppercase tracking-wide bg-zinc-800 text-zinc-400 px-2.5 py-1 rounded-lg mb-4">
            Current Plan
          </span>
        )}
        <h2 className="text-lg font-semibold text-zinc-100 mb-1">Free</h2>
        <p className="text-3xl font-bold text-zinc-100 mb-1">
          €0<span className="text-sm font-normal text-zinc-500">/month</span>
        </p>
        <p className="text-xs text-zinc-500 mb-6">Get started with the basics</p>
        <ul className="space-y-2.5 text-sm text-zinc-400">
          <li className="flex items-center gap-2.5">
            <CheckIcon />
            10 leads
          </li>
          <li className="flex items-center gap-2.5">
            <CheckIcon />
            CSV import
          </li>
          <li className="flex items-center gap-2.5">
            <CheckIcon />
            Analytics dashboard
          </li>
          <li className="flex items-center gap-2.5">
            <CheckIcon />
            URL-to-lead (5 uses)
          </li>
          <li className="flex items-center gap-2.5 text-zinc-600">
            <XIcon />
            AI-powered messages
          </li>
          <li className="flex items-center gap-2.5 text-zinc-600">
            <XIcon />
            Bulk URL import
          </li>
        </ul>
      </div>

      {/* Pro plan */}
      <div className={`bg-zinc-900/50 border rounded-2xl p-6 ${currentPlan === "pro" ? "border-indigo-500/40" : "border-zinc-800/80"}`}>
        {currentPlan === "pro" && (
          <span className="inline-block text-[10px] font-bold uppercase tracking-wide bg-indigo-500/15 text-indigo-400 px-2.5 py-1 rounded-lg mb-4">
            Current Plan
          </span>
        )}
        <h2 className="text-lg font-semibold text-zinc-100 mb-1">Pro</h2>
        <p className="text-3xl font-bold text-zinc-100 mb-1">
          €29<span className="text-sm font-normal text-zinc-500">/month</span>
        </p>
        <p className="text-xs text-zinc-500 mb-6">Unlimited outreach power</p>
        <ul className="space-y-2.5 text-sm text-zinc-400 mb-6">
          <li className="flex items-center gap-2.5">
            <CheckIcon />
            Unlimited leads
          </li>
          <li className="flex items-center gap-2.5">
            <CheckIcon />
            AI-powered messages
          </li>
          <li className="flex items-center gap-2.5">
            <CheckIcon />
            Bulk URL import
          </li>
          <li className="flex items-center gap-2.5">
            <CheckIcon />
            Unlimited URL-to-lead
          </li>
          <li className="flex items-center gap-2.5">
            <CheckIcon />
            Everything in Free
          </li>
        </ul>

        {currentPlan === "free" ? (
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full text-sm py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-medium rounded-xl transition-all"
          >
            {loading ? "Redirecting..." : "Upgrade to Pro"}
          </button>
        ) : (
          <button
            onClick={handleManage}
            disabled={loading}
            className="w-full text-sm py-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 font-medium rounded-xl transition-all"
          >
            {loading ? "Redirecting..." : "Manage Subscription"}
          </button>
        )}
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 shrink-0">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-700 shrink-0">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/pricing-cards.tsx
git commit -m "feat: add pricing cards client component"
```

---

### Task 15: Add Pricing Link to Main Page Header + Pass Plan to Dashboard

**Files:**
- Modify: `src/app/page.tsx:1-54`
- Modify: `src/components/dashboard.tsx:1-16`

- [ ] **Step 1: Update `src/app/page.tsx` to fetch plan and pass it to Dashboard**

Add the import at the top:

```ts
import { getUserPlan } from "@/lib/plans";
```

In the `Home` function, after `const isAdmin = currentUser?.role === "ADMIN";`, add:

```ts
  const plan = await getUserPlan(session.user.id);
```

Add a Pricing link in the header, next to the Admin link. Inside the `<div className="flex items-center gap-3">`, add before the Admin link:

```tsx
          <Link
            href="/pricing"
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-300 transition-colors"
          >
            {plan.plan === "pro" ? "Pro" : "Upgrade"}
          </Link>
```

Update the Dashboard component usage to pass the plan:

```tsx
      <Dashboard initialLeads={leads} plan={plan} />
```

- [ ] **Step 2: Update Dashboard to accept and use the plan prop**

In `src/components/dashboard.tsx`, update the imports to add the type:

```ts
import type { UserPlan } from "@/lib/plans";
```

Update the `Props` type:

```ts
type Props = {
  initialLeads: Lead[];
  plan: UserPlan;
};
```

Update the component signature:

```ts
export function Dashboard({ initialLeads, plan }: Props) {
```

For the "Bulk Import" link, make it conditional. Replace the existing `<a href="/bulk-import" ...>` block with:

```tsx
          {plan.canBulkImport ? (
            <a
              href="/bulk-import"
              className="text-sm px-3.5 py-2.5 bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-300 font-medium rounded-xl transition-all duration-150 flex items-center gap-1.5"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
                <path d="M16 16l-4-4-4 4" />
                <path d="M12 12v9" />
                <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
              </svg>
              Bulk Import
            </a>
          ) : (
            <span
              className="text-sm px-3.5 py-2.5 bg-zinc-900/50 text-zinc-600 border border-zinc-800/50 font-medium rounded-xl flex items-center gap-1.5 cursor-not-allowed"
              title="Pro feature"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                <path d="M16 16l-4-4-4 4" />
                <path d="M12 12v9" />
                <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
              </svg>
              Bulk Import
            </span>
          )}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx src/components/dashboard.tsx
git commit -m "feat: add pricing link to header, pass plan to dashboard, disable gated buttons"
```

---

### Task 16: Build Verification

- [ ] **Step 1: Run the build**

Run:
```bash
npx next build 2>&1 | tail -15
```

Expected: Build succeeds with all routes listed including `/pricing`, `/api/stripe/checkout`, `/api/stripe/portal`, `/api/stripe/webhook`.

- [ ] **Step 2: Fix any type errors if needed**

If the Stripe `apiVersion` causes a type error in `src/lib/stripe.ts`, change it to:

```ts
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
```

(Omitting `apiVersion` uses the SDK's built-in default.)

- [ ] **Step 3: Final commit and push**

```bash
git add -A
git commit -m "feat: add Stripe subscriptions — Free/Pro plans with billing, webhooks, and feature gating"
git push
```
