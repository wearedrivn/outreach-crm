# Premium SaaS Landing Page — Design Spec

**Date:** 2026-04-14
**Route:** `/landing` (public, no auth required)
**Style:** Dark, minimal, high-end
**Approach:** Single-page scroll with anchor navigation

---

## Design System

Inherits from the existing app:
- **Background:** zinc-950 base, alternating zinc-900/30 bands for section separation
- **Accent:** indigo-500/600 for CTAs, labels, and glows
- **Text:** zinc-100 for headlines, zinc-400 for body, zinc-500 for muted
- **Font:** Geist (already loaded in layout)
- **Border radius:** rounded-2xl for cards, rounded-xl for buttons
- **Animations:** fade-in, slide-up, scale-in (existing in globals.css), plus scroll-triggered variants

All CTAs on this page link to `/register` (no Stripe calls — upgrade happens post-login from `/pricing`).

---

## Section 1: Navigation Header

**Behavior:** Fixed top, transparent initially. On scroll: `bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800/50`.

**Desktop layout:**
- Left: App name/logo text
- Center: Anchor links — Problem, Solution, How It Works, Pricing. Smooth scroll on click. Active section gets subtle indigo underline.
- Right: "Login" (ghost button, border zinc-700) + "Start Free" (indigo-600 filled button)

**Mobile layout:**
- Left: App name
- Right: Hamburger icon
- Menu slides down with anchor links + auth buttons stacked vertically

---

## Section 2: Hero

**Background:** zinc-950 with a subtle radial gradient glow (indigo/purple, very faint, centered behind the dashboard mockup).

**Desktop layout:** Two columns, vertically centered, full viewport height.

**Left column (text):**
- Headline: "Turn your outreach into a predictable client acquisition machine."
  - Large (text-4xl md:text-5xl lg:text-6xl), font-bold, white
- Subtext: "We help high-end businesses attract premium clients through organic content and strategic outreach — no ads, no trends."
  - text-lg, zinc-400
- CTA button: "Get Started" — large indigo-600 button, hover glow effect
- Muted line below: "Free plan available — no credit card required" — text-sm, zinc-500

**Right column (illustration):**
Dashboard mockup — a crafted CSS/SVG illustration (not a screenshot):
- Dark card (zinc-900 bg, rounded-2xl, border zinc-800/50)
- 3-4 fake lead rows showing: name, score badges (emerald for high brand score, amber for medium), status indicator
- A mini "Generate Message" button hint in indigo
- Soft indigo glow/shadow behind the card
- Card slightly rotated (~2deg) for depth

**Animations:**
- Text fades up from left (staggered: headline first, subtext second, CTA third)
- Dashboard card fades in from right with slight upward drift

**Mobile:** Stacks vertically — text on top, dashboard mockup below (scaled down, no rotation).

---

## Section 3: Problem

**Background:** zinc-900/50 band for visual separation.

**Layout:** Centered text block, max-w-2xl.

**Content:**
- Section label: "The Problem" — text-xs, uppercase, tracking-widest, indigo-400
- Headline: "You have a premium offer. But your content doesn't reflect it." — text-3xl md:text-4xl, font-bold, zinc-100
- Pain points as separate lines:
  - "Your outreach feels random."
  - "And the right clients aren't coming in consistently."
  - Each in text-lg, zinc-400
- Visual pause: extra spacing or thin indigo divider line
- Punchline: "You don't need more leads. You need better ones." — text-xl, font-semibold, zinc-100

**Illustration:** Minimal line-art icon above the headline — broken target or scattered arrows representing unfocused outreach. Stroke style, zinc-500, ~48px.

**Animations:** Each pain point line fades in sequentially on scroll. Punchline fades in last with slight delay.

---

## Section 4: Solution

**Background:** zinc-950.

**Desktop layout:** Two columns.

**Left column (text):**
- Section label: "The Solution" — text-xs, uppercase, tracking-widest, indigo-400
- Headline: "This is not a CRM. This is your client acquisition system." — text-3xl md:text-4xl, font-bold, zinc-100

**Right column (features):** Five feature rows, each as a card-like element:
- zinc-900/50 bg, rounded-xl, px-4 py-3, border zinc-800/30
- Left: unique line-art SVG icon per feature (zinc-400 stroke, ~20px):
  - Target icon — "Identify high-value prospects instantly"
  - Chart-down icon — "Spot brands with money but weak content"
  - Message icon — "Generate premium outreach messages in seconds"
  - Folder icon — "Track every conversation in one place"
  - Pipeline icon — "Build a consistent pipeline of qualified clients"
- Right of icon: emerald-400 checkmark + feature text in zinc-300

**Animations:** Left text fades up. Right feature rows stagger in one by one.

**Mobile:** Stacked — text block on top, feature rows below full-width.

---

## Section 5: How It Works

**Background:** zinc-900/30 band.

**Header (centered):**
- Section label: "How It Works" — text-xs, uppercase, tracking-widest, indigo-400
- Headline: "From lead to client in 4 steps" — text-3xl md:text-4xl, font-bold, zinc-100

**Layout:** Four cards in a horizontal row on desktop, vertical stack on mobile.

**Each card:**
- zinc-900/50 bg, rounded-2xl, border zinc-800/50, p-6
- Step number in small indigo-600 circle (w-8 h-8, centered number)
- Line-art icon above (~32px, zinc-400 stroke)
- Bold title (zinc-100)
- Short description (zinc-400, text-sm)
- Subtle hover: slight lift (translate-y) + border brightens

**Steps:**

| # | Icon | Title | Description |
|---|------|-------|-------------|
| 1 | Upload icon | Add Leads | Manually, CSV import, or paste a URL |
| 2 | Scoring bars icon | Auto-Score | Brand strength, content quality, and revenue scored instantly |
| 3 | Message icon | Generate Outreach | AI-crafted messages tailored to each prospect |
| 4 | Handshake icon | Close Clients | Track conversations and close high-end deals consistently |

**Connecting line:** Subtle dashed line (zinc-800) connecting steps horizontally between the step number circles. Hidden on mobile.

**Animations:** Cards stagger in left to right on scroll.

---

## Section 6: Differentiation

**Background:** zinc-950.

**Header (centered):**
- Section label: "Why Us" — text-xs, uppercase, tracking-widest, indigo-400
- Headline: "Most outreach tools optimize for volume. We optimize for positioning." — text-3xl md:text-4xl, font-bold, zinc-100

**Illustration:** Diamond line-art icon above the headline (~40px, indigo-400 stroke).

**Layout:** Two-column comparison table on desktop, stacked on mobile.

**Comparison rows (4 rows):**

| Others (left) | This System (right) |
|----------------|---------------------|
| Optimize for volume | Optimize for positioning |
| More leads, more noise | Fewer leads, higher quality |
| Generic templates | Tailored premium messaging |
| Built for everyone | Built for premium brands |

**Left column styling:** zinc-800 bg, zinc-500 text, red-400 X icon prefix.
**Right column styling:** zinc-900 bg with indigo-500/5 tint, zinc-200 text, emerald-400 check icon prefix.
Cards: rounded-xl, subtle border.

**Callout block below comparison:**
- zinc-900 bg, rounded-xl, left border-2 border-indigo-500
- Quote: "Booked 3 high-ticket clients in 2 weeks using this system."
- Styled as a result highlight (no attribution, no quotation marks framing it as a testimonial)
- text-lg, zinc-200, italic

**Animations:** Comparison rows stagger in. Callout slides up after.

---

## Section 7: Pricing

**Background:** zinc-900/30 band.

**Header (centered):**
- Section label: "Pricing" — text-xs, uppercase, tracking-widest, indigo-400
- Headline: "Simple, transparent pricing" — text-3xl md:text-4xl, font-bold, zinc-100

**Layout:** Two cards centered, side by side on desktop, stacked on mobile. Reuses the feature list and styling from existing `PricingCards` but adapted for the public landing page (no auth, no Stripe calls).

**Free card:**
- zinc-900/50 bg, rounded-2xl, border zinc-800/80, p-6
- Title: "Free" — text-lg, font-semibold
- Price: "€0/month"
- Tagline: "Get started with the basics"
- Features (with check/x icons):
  - [check] 10 leads
  - [check] CSV import
  - [check] Analytics dashboard
  - [check] URL-to-lead (5 uses)
  - [x] AI-powered messages
  - [x] Bulk URL import
- Button: "Start Free" — zinc-800 bg, zinc-300 text, links to `/register`

**Pro card (highlighted):**
- zinc-900/50 bg, rounded-2xl, border indigo-500/40, p-6
- "Most Popular" badge — indigo-500/15 bg, indigo-400 text, text-xs uppercase
- Title: "Pro" — text-lg, font-semibold
- Price: "€29/month"
- Tagline: "Unlimited outreach power"
- Features (all checks):
  - [check] Unlimited leads
  - [check] AI-powered messages
  - [check] Bulk URL import
  - [check] Unlimited URL-to-lead
  - [check] Everything in Free
- Button: "Get Started" — indigo-600 bg, white text, links to `/register`

**Animations:** Both cards scale in together.

---

## Section 8: Final CTA

**Background:** zinc-950, extra vertical padding (py-24 md:py-32).

**Layout:** Centered, max-w-2xl.

**Content:**
- Headline: "If your brand is premium, your outreach should be too." — text-3xl md:text-4xl, font-bold, zinc-100
- Subtext: "Start building your client acquisition system today." — text-lg, zinc-400
- CTA button: "Start Free" — large indigo-600 button (same style as hero)
- Muted line: "No credit card required" — text-sm, zinc-500

**Visual touch:** Subtle radial indigo glow behind the CTA area, mirroring the hero glow — bookends the page.

**Animation:** Fade up on scroll.

---

## Footer

Minimal footer below the CTA:
- zinc-900/50 bg, border-t border-zinc-800/50, py-8
- Centered: App name + "© 2026" in zinc-500, text-sm

---

## Scroll Animations Strategy

Use Intersection Observer (via a small custom hook `useInView`) to trigger CSS animations when sections enter the viewport. No heavy animation libraries.

- Elements start with `opacity-0 translate-y-4`
- On intersection: transition to `opacity-100 translate-y-0`
- Stagger delays via inline `transition-delay` for sequential elements
- Duration: 500-700ms, easing: ease-out

---

## Responsive Breakpoints

- **Mobile (<768px):** Single column throughout. Nav collapses to hamburger. Hero stacks text above mockup. Steps stack vertically. Comparison stacks.
- **Tablet (768-1024px):** Two columns where applicable, slightly reduced spacing.
- **Desktop (>1024px):** Full layout as described above.

---

## File Structure

- `src/app/landing/page.tsx` — Server component, renders the full landing page
- `src/components/landing/` — Directory for landing page components:
  - `nav-header.tsx` — Fixed navigation with scroll behavior
  - `hero-section.tsx` — Hero with text + dashboard mockup
  - `problem-section.tsx` — Problem statement
  - `solution-section.tsx` — Solution with feature list
  - `how-it-works-section.tsx` — 4-step process
  - `differentiation-section.tsx` — Comparison + callout
  - `pricing-section.tsx` — Public pricing cards (no Stripe)
  - `cta-section.tsx` — Final CTA
  - `footer.tsx` — Minimal footer
  - `dashboard-mockup.tsx` — SVG/CSS dashboard illustration for hero
  - `use-in-view.ts` — Custom hook for scroll-triggered animations
  - `icons.tsx` — Line-art SVG icons used across sections
