# Stripe Subscriptions Design

## Overview

Add a Free/Pro subscription model to the Outreach CRM using Stripe Checkout Sessions, Stripe webhooks, and Stripe Customer Portal. No embedded payment forms — Stripe hosts all payment and billing management UI.

## Plans

| | Free | Pro (EUR 29/month) |
|---|---|---|
| Max leads | 10 | Unlimited |
| AI message generation | No | Yes |
| Bulk URL import | No | Yes |
| URL-to-lead | 5 uses total | Unlimited |
| CSV import | Yes | Yes |
| Analytics | Yes | Yes |

No free trial. Users start on Free and upgrade when ready. On cancellation, Pro access continues until the end of the billing period.

## Database Changes

Add fields to the existing `User` model in Prisma:

```prisma
model User {
  // ... existing fields ...
  stripeCustomerId       String?   @unique
  stripeSubscriptionId   String?
  stripePriceId          String?
  stripeCurrentPeriodEnd DateTime?
  urlToLeadUsage         Int       @default(0)
}
```

No separate Subscription table. Subscription status is derived: if `stripeCurrentPeriodEnd` is in the future, the user is Pro. Otherwise, Free.

## Server-Side Plan Helper

A function `getUserPlan(userId)` in `src/lib/plans.ts` returns:

```ts
{
  plan: "free" | "pro",
  leadCount: number,
  leadLimit: number,        // 10 or Infinity
  canUseAI: boolean,
  canBulkImport: boolean,
  urlToLeadRemaining: number, // (5 - usage) or Infinity
}
```

This is the single source of truth for all feature gating.

## Stripe Integration Flow

### Checkout (subscribe)

1. User visits `/pricing`, clicks "Upgrade to Pro"
2. Client calls `POST /api/stripe/checkout`
3. Server creates a Stripe Checkout Session with:
   - `mode: "subscription"`
   - `line_items`: the EUR 29/month price
   - `customer_email`: user's email
   - `metadata.userId`: the user's database ID
   - `success_url`: `/pricing?success=true`
   - `cancel_url`: `/pricing`
4. Server returns the Checkout Session URL
5. Client redirects to Stripe's hosted checkout
6. On payment, webhook `checkout.session.completed` fires
7. Webhook handler stores `stripeCustomerId`, `stripeSubscriptionId`, `stripePriceId`, `stripeCurrentPeriodEnd` on the User

### Cancellation (via Stripe Customer Portal)

1. User clicks "Manage Subscription" on `/pricing`
2. Client calls `POST /api/stripe/portal`
3. Server creates a Stripe Customer Portal session with `customer: stripeCustomerId`
4. Server returns the portal URL
5. Client redirects to Stripe's portal
6. If user cancels: Stripe sets `cancel_at_period_end: true`
7. Webhook `customer.subscription.updated` fires — we update `stripeCurrentPeriodEnd` (no change yet, user keeps Pro)
8. When period ends, `customer.subscription.deleted` fires — we clear `stripeSubscriptionId`, `stripePriceId`, `stripeCurrentPeriodEnd`

### Webhook Events

Route: `POST /api/stripe/webhook` (no auth, verified by Stripe signature)

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Store customer ID, subscription ID, price ID, period end on User |
| `customer.subscription.updated` | Update `stripeCurrentPeriodEnd` (and price ID if changed) |
| `customer.subscription.deleted` | Clear subscription fields (user drops to Free) |

## API Routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/stripe/checkout` | POST | Yes | Create Checkout Session, return URL |
| `/api/stripe/portal` | POST | Yes | Create Customer Portal session, return URL |
| `/api/stripe/webhook` | POST | No (Stripe signature) | Handle webhook events |

## Feature Gating

### Server-side (enforcement)

- `POST /api/leads` — check lead count against limit before creating
- `POST /api/generate-message` — check `canUseAI`
- `POST /api/leads/from-url-batch` — check `canBulkImport`
- `POST /api/leads/from-url` — check `urlToLeadRemaining`, increment `urlToLeadUsage` on success
- All return 403 with `{ error: "...", upgrade: true }` when gated

### Client-side (UX)

- The server component at `/` passes `plan` info to the Dashboard component
- Gated buttons (AI message, bulk import) are visually disabled with a "Pro feature" tooltip
- When the API returns 403 with `upgrade: true`, show a brief message directing to `/pricing`

## Pricing Page

Server component at `/pricing`, reads user's current plan.

### Layout

Two plan cards side by side:

**Free card:**
- 10 leads
- CSV import
- Analytics
- URL-to-lead (5 uses)

**Pro card (EUR 29/mo):**
- Unlimited leads
- AI-powered messages
- Bulk URL import
- Unlimited URL-to-lead
- Everything in Free

### States

- **User is Free:** Pro card has "Upgrade to Pro" button → calls `/api/stripe/checkout` → redirects to Stripe
- **User is Pro:** Pro card shows "Current Plan" badge + "Manage Subscription" button → calls `/api/stripe/portal` → redirects to Stripe portal
- **`?success=true` in URL:** Success banner at top: "Welcome to Pro!"

### Navigation

Link to `/pricing` added in the main page header.

## Proxy/Middleware Update

Add `/api/stripe/webhook` to the proxy matcher exclusion list in `src/proxy.ts` so the webhook route is not blocked by auth.

Updated matcher:
```
"/((?!login|register|api/auth|api/diag|api/stripe/webhook|_next/static|_next/image|favicon.ico).*)"
```

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Stripe server-side API key |
| `STRIPE_WEBHOOK_SECRET` | Webhook endpoint signing secret |
| `STRIPE_PRO_PRICE_ID` | Price ID for EUR 29/month plan |

No client-side Stripe key needed (Checkout Sessions use server-side redirect).

## Stripe Dashboard Setup (manual)

1. Create Product: "Outreach CRM Pro"
2. Add Price: EUR 29/month, recurring
3. Create webhook endpoint: `https://<domain>/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Enable Customer Portal in Stripe settings

## Design Decisions

- **No separate Subscription table** — subscription state lives on User for simplicity. One user = one subscription.
- **Derived plan status** — check `stripeCurrentPeriodEnd > now()` rather than storing a plan enum. Avoids stale state.
- **No embedded payment UI** — Stripe Checkout handles PCI compliance, SCA/3DS, and card validation. Less code, fewer bugs.
- **No free trial** — users start on Free, upgrade when ready.
- **Graceful downgrade** — on cancel, Pro stays active until period ends (standard SaaS behavior).
