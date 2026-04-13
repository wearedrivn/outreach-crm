# Premium SaaS Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a premium, dark-themed public landing page at `/landing` with 8 sections, scroll animations, responsive layout, and a dashboard mockup illustration.

**Architecture:** Single Next.js page at `src/app/landing/page.tsx` composed of isolated section components in `src/components/landing/`. All client interactivity (scroll detection, mobile menu, animations) lives in client components. A custom `useInView` hook handles scroll-triggered animations via Intersection Observer. The `/landing` route is excluded from auth proxy.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4, TypeScript

---

### Task 1: Auth Proxy Exclusion + Page Shell

**Files:**
- Modify: `src/proxy.ts:43-46`
- Create: `src/app/landing/page.tsx`

- [ ] **Step 1: Update proxy matcher to exclude `/landing`**

In `src/proxy.ts`, update the matcher regex to add `landing|` to the exclusion list:

```ts
export const config = {
  matcher: [
    "/((?!login|register|landing|api/auth|api/diag|api/stripe/webhook|_next/static|_next/image|favicon.ico).*)",
  ],
};
```

- [ ] **Step 2: Create the landing page shell**

Create `src/app/landing/page.tsx`:

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Outreach CRM — Premium Client Acquisition System",
  description:
    "Turn your outreach into a predictable client acquisition machine. Built for high-end businesses that attract premium clients through organic content and strategic outreach.",
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="text-center py-40 text-zinc-500">
        Landing page sections go here
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Verify the page loads without auth**

Run: `npm run dev`

Open `http://localhost:3000/landing` in a browser (not logged in). Should see the placeholder text without being redirected to `/login`.

- [ ] **Step 4: Commit**

```bash
git add src/proxy.ts src/app/landing/page.tsx
git commit -m "feat: add landing page shell with public route"
```

---

### Task 2: useInView Hook + Scroll Animation CSS

**Files:**
- Create: `src/components/landing/use-in-view.ts`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Create the useInView hook**

Create `src/components/landing/use-in-view.ts`:

```ts
"use client";

import { useEffect, useRef, useState } from "react";

export function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}
```

- [ ] **Step 2: Add scroll animation utilities to globals.css**

Append to `src/app/globals.css` after the existing animation classes:

```css
/* ── Scroll-triggered animations ─────────────────────── */

.scroll-hidden {
  opacity: 0;
  transform: translateY(16px);
}

.scroll-visible {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}
```

- [ ] **Step 3: Verify CSS compiles**

Run: `npm run dev`

Check the terminal for no CSS errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/landing/use-in-view.ts src/app/globals.css
git commit -m "feat: add useInView hook and scroll animation CSS"
```

---

### Task 3: SVG Icons

**Files:**
- Create: `src/components/landing/icons.tsx`

- [ ] **Step 1: Create all SVG icons used across landing sections**

Create `src/components/landing/icons.tsx`:

```tsx
type IconProps = { className?: string; size?: number };

export function TargetIcon({ className = "", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

export function ChartDownIcon({ className = "", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 3v18h18" />
      <path d="M7 16l4-4 4 2 6-8" />
    </svg>
  );
}

export function MessageIcon({ className = "", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

export function FolderIcon({ className = "", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  );
}

export function PipelineIcon({ className = "", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

export function UploadIcon({ className = "", size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

export function ScoringIcon({ className = "", size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="4" y="14" width="4" height="6" rx="1" />
      <rect x="10" y="8" width="4" height="12" rx="1" />
      <rect x="16" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

export function HandshakeIcon({ className = "", size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20.42 4.58a5.4 5.4 0 00-7.65 0l-.77.78-.77-.78a5.4 5.4 0 00-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z" />
    </svg>
  );
}

export function BrokenTargetIcon({ className = "", size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <line x1="4" y1="4" x2="8" y2="8" />
      <line x1="16" y1="16" x2="20" y2="20" />
    </svg>
  );
}

export function DiamondIcon({ className = "", size = 40 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 3h12l4 6-10 12L2 9z" />
      <path d="M2 9h20" />
      <path d="M10 3l-4 6 6 12 6-12-4-6" />
    </svg>
  );
}

export function CheckIcon({ className = "", size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function XIcon({ className = "", size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/landing/icons.tsx
git commit -m "feat: add landing page SVG icons"
```

---

### Task 4: Dashboard Mockup Illustration

**Files:**
- Create: `src/components/landing/dashboard-mockup.tsx`

- [ ] **Step 1: Create the dashboard mockup component**

Create `src/components/landing/dashboard-mockup.tsx`:

```tsx
export function DashboardMockup() {
  return (
    <div className="relative">
      {/* Indigo glow behind card */}
      <div className="absolute -inset-8 bg-indigo-500/10 rounded-3xl blur-3xl" />

      <div className="relative bg-zinc-900 border border-zinc-800/50 rounded-2xl p-5 shadow-2xl md:rotate-2">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-zinc-400">Recent Leads</span>
          <span className="text-[10px] px-2 py-0.5 bg-indigo-500/15 text-indigo-400 rounded-md font-medium">
            3 new
          </span>
        </div>

        {/* Lead rows */}
        <div className="space-y-2.5">
          <LeadRow
            name="Studio Noir"
            brandScore={9}
            contentScore={3}
            revenue="high"
          />
          <LeadRow
            name="Maison Éclat"
            brandScore={8}
            contentScore={4}
            revenue="high"
          />
          <LeadRow
            name="Atelier Luxe"
            brandScore={7}
            contentScore={6}
            revenue="mid"
          />
          <LeadRow
            name="Casa Prima"
            brandScore={6}
            contentScore={5}
            revenue="mid"
          />
        </div>

        {/* Generate button hint */}
        <div className="mt-4 flex justify-end">
          <span className="text-[10px] px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-medium">
            Generate Message
          </span>
        </div>
      </div>
    </div>
  );
}

function LeadRow({
  name,
  brandScore,
  contentScore,
  revenue,
}: {
  name: string;
  brandScore: number;
  contentScore: number;
  revenue: "high" | "mid";
}) {
  return (
    <div className="flex items-center justify-between bg-zinc-800/50 rounded-xl px-3.5 py-2.5">
      <span className="text-sm text-zinc-200 font-medium">{name}</span>
      <div className="flex items-center gap-2">
        <Badge
          label={`B:${brandScore}`}
          color={brandScore >= 8 ? "emerald" : "amber"}
        />
        <Badge
          label={`C:${contentScore}`}
          color={contentScore <= 4 ? "emerald" : "zinc"}
        />
        <span
          className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
            revenue === "high"
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-zinc-700/50 text-zinc-400"
          }`}
        >
          {revenue}
        </span>
      </div>
    </div>
  );
}

function Badge({
  label,
  color,
}: {
  label: string;
  color: "emerald" | "amber" | "zinc";
}) {
  const colors = {
    emerald: "bg-emerald-500/15 text-emerald-400",
    amber: "bg-amber-500/15 text-amber-400",
    zinc: "bg-zinc-700/50 text-zinc-500",
  };
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${colors[color]}`}>
      {label}
    </span>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/landing/dashboard-mockup.tsx
git commit -m "feat: add dashboard mockup illustration component"
```

---

### Task 5: Navigation Header

**Files:**
- Create: `src/components/landing/nav-header.tsx`

- [ ] **Step 1: Create the nav header component**

Create `src/components/landing/nav-header.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { label: "Problem", href: "#problem" },
  { label: "Solution", href: "#solution" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

export function NavHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = NAV_LINKS.map((l) => l.href.slice(1));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-40% 0px -60% 0px" },
    );

    for (const id of sections) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  function handleAnchorClick(href: string) {
    setMenuOpen(false);
    const id = href.slice(1);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800/50"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <span className="text-base font-semibold text-zinc-100 tracking-tight">
          Outreach CRM
        </span>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <button
              key={link.href}
              onClick={() => handleAnchorClick(link.href)}
              className={`text-sm transition-colors ${
                activeSection === link.href.slice(1)
                  ? "text-indigo-400"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Desktop auth buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-zinc-400 hover:text-zinc-200 px-4 py-2 border border-zinc-700 rounded-xl transition-colors"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="text-sm text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl font-medium transition-colors"
          >
            Start Free
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-zinc-400 hover:text-zinc-200 p-2"
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {menuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-zinc-950/95 backdrop-blur-lg border-b border-zinc-800/50 animate-slide-up">
          <div className="px-4 py-4 space-y-3">
            {NAV_LINKS.map((link) => (
              <button
                key={link.href}
                onClick={() => handleAnchorClick(link.href)}
                className="block w-full text-left text-sm text-zinc-400 hover:text-zinc-200 py-2"
              >
                {link.label}
              </button>
            ))}
            <div className="flex flex-col gap-2 pt-3 border-t border-zinc-800/50">
              <Link
                href="/login"
                className="text-sm text-zinc-400 text-center py-2.5 border border-zinc-700 rounded-xl"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="text-sm text-white bg-indigo-600 text-center py-2.5 rounded-xl font-medium"
              >
                Start Free
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/landing/nav-header.tsx
git commit -m "feat: add landing page navigation header"
```

---

### Task 6: Hero Section

**Files:**
- Create: `src/components/landing/hero-section.tsx`

- [ ] **Step 1: Create the hero section component**

Create `src/components/landing/hero-section.tsx`:

```tsx
import Link from "next/link";
import { DashboardMockup } from "./dashboard-mockup";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-16">
      {/* Background glow */}
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text column */}
          <div className="animate-slide-up">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-zinc-100 tracking-tight leading-[1.1]">
              Turn your outreach into a predictable client acquisition machine.
            </h1>
            <p className="text-lg text-zinc-400 mt-6 max-w-lg">
              We help high-end businesses attract premium clients through organic
              content and strategic outreach — no ads, no trends.
            </p>
            <div className="mt-8">
              <Link
                href="/register"
                className="inline-flex items-center px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-base transition-all hover:shadow-lg hover:shadow-indigo-500/20"
              >
                Get Started
              </Link>
              <p className="text-sm text-zinc-500 mt-3">
                Free plan available — no credit card required
              </p>
            </div>
          </div>

          {/* Dashboard mockup column */}
          <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <DashboardMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/landing/hero-section.tsx
git commit -m "feat: add hero section with dashboard mockup"
```

---

### Task 7: Problem Section

**Files:**
- Create: `src/components/landing/problem-section.tsx`

- [ ] **Step 1: Create the problem section component**

Create `src/components/landing/problem-section.tsx`:

```tsx
"use client";

import { useInView } from "./use-in-view";
import { BrokenTargetIcon } from "./icons";

export function ProblemSection() {
  const { ref, isVisible } = useInView();

  return (
    <section id="problem" className="py-24 md:py-32 bg-zinc-900/50">
      <div
        ref={ref}
        className={`max-w-2xl mx-auto px-4 sm:px-6 text-center ${isVisible ? "scroll-visible" : "scroll-hidden"}`}
      >
        <BrokenTargetIcon className="text-zinc-500 mx-auto mb-6" />

        <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
          The Problem
        </span>

        <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mt-4">
          You have a premium offer. But your content doesn&apos;t reflect it.
        </h2>

        <div className="mt-8 space-y-3">
          <p
            className="text-lg text-zinc-400"
            style={{ transitionDelay: isVisible ? "0.1s" : "0s" }}
          >
            Your outreach feels random.
          </p>
          <p
            className="text-lg text-zinc-400"
            style={{ transitionDelay: isVisible ? "0.2s" : "0s" }}
          >
            And the right clients aren&apos;t coming in consistently.
          </p>
        </div>

        <div className="w-12 h-px bg-indigo-500/40 mx-auto my-8" />

        <p
          className="text-xl font-semibold text-zinc-100"
          style={{ transitionDelay: isVisible ? "0.4s" : "0s" }}
        >
          You don&apos;t need more leads. You need better ones.
        </p>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/landing/problem-section.tsx
git commit -m "feat: add problem section with scroll animation"
```

---

### Task 8: Solution Section

**Files:**
- Create: `src/components/landing/solution-section.tsx`

- [ ] **Step 1: Create the solution section component**

Create `src/components/landing/solution-section.tsx`:

```tsx
"use client";

import { useInView } from "./use-in-view";
import {
  TargetIcon,
  ChartDownIcon,
  MessageIcon,
  FolderIcon,
  PipelineIcon,
  CheckIcon,
} from "./icons";

const FEATURES = [
  { icon: TargetIcon, text: "Identify high-value prospects instantly" },
  { icon: ChartDownIcon, text: "Spot brands with money but weak content" },
  { icon: MessageIcon, text: "Generate premium outreach messages in seconds" },
  { icon: FolderIcon, text: "Track every conversation in one place" },
  { icon: PipelineIcon, text: "Build a consistent pipeline of qualified clients" },
];

export function SolutionSection() {
  const { ref, isVisible } = useInView();

  return (
    <section id="solution" className="py-24 md:py-32">
      <div
        ref={ref}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Text column */}
          <div className={isVisible ? "scroll-visible" : "scroll-hidden"}>
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
              The Solution
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mt-4">
              This is not a CRM. This is your client acquisition system.
            </h2>
          </div>

          {/* Feature rows */}
          <div className="space-y-3">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.text}
                  className={`flex items-center gap-4 bg-zinc-900/50 border border-zinc-800/30 rounded-xl px-4 py-3 ${
                    isVisible ? "scroll-visible" : "scroll-hidden"
                  }`}
                  style={{
                    transitionDelay: isVisible ? `${(i + 1) * 0.1}s` : "0s",
                  }}
                >
                  <Icon className="text-zinc-400 shrink-0" size={20} />
                  <CheckIcon className="text-emerald-400 shrink-0" size={14} />
                  <span className="text-sm text-zinc-300">{feature.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/landing/solution-section.tsx
git commit -m "feat: add solution section with feature rows"
```

---

### Task 9: How It Works Section

**Files:**
- Create: `src/components/landing/how-it-works-section.tsx`

- [ ] **Step 1: Create the how-it-works section component**

Create `src/components/landing/how-it-works-section.tsx`:

```tsx
"use client";

import { useInView } from "./use-in-view";
import { UploadIcon, ScoringIcon, MessageIcon, HandshakeIcon } from "./icons";

const STEPS = [
  {
    num: 1,
    icon: UploadIcon,
    title: "Add Leads",
    description: "Manually, CSV import, or paste a URL",
  },
  {
    num: 2,
    icon: ScoringIcon,
    title: "Auto-Score",
    description: "Brand strength, content quality, and revenue scored instantly",
  },
  {
    num: 3,
    icon: MessageIcon,
    title: "Generate Outreach",
    description: "AI-crafted messages tailored to each prospect",
  },
  {
    num: 4,
    icon: HandshakeIcon,
    title: "Close Clients",
    description: "Track conversations and close high-end deals consistently",
  },
];

export function HowItWorksSection() {
  const { ref, isVisible } = useInView();

  return (
    <section id="how-it-works" className="py-24 md:py-32 bg-zinc-900/30">
      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-16 ${isVisible ? "scroll-visible" : "scroll-hidden"}`}>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            How It Works
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mt-4">
            From lead to client in 4 steps
          </h2>
        </div>

        {/* Steps grid */}
        <div className="relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden lg:block absolute top-[4.5rem] left-[12.5%] right-[12.5%] h-px border-t border-dashed border-zinc-800" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className={`relative bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 text-center hover:-translate-y-1 hover:border-zinc-700/50 transition-all ${
                    isVisible ? "scroll-visible" : "scroll-hidden"
                  }`}
                  style={{
                    transitionDelay: isVisible ? `${i * 0.15}s` : "0s",
                  }}
                >
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-sm font-bold text-white mx-auto mb-4">
                    {step.num}
                  </div>
                  <Icon className="text-zinc-400 mx-auto mb-3" size={32} />
                  <h3 className="text-base font-semibold text-zinc-100 mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm text-zinc-400">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/landing/how-it-works-section.tsx
git commit -m "feat: add how-it-works section with step cards"
```

---

### Task 10: Differentiation Section

**Files:**
- Create: `src/components/landing/differentiation-section.tsx`

- [ ] **Step 1: Create the differentiation section component**

Create `src/components/landing/differentiation-section.tsx`:

```tsx
"use client";

import { useInView } from "./use-in-view";
import { DiamondIcon, CheckIcon, XIcon } from "./icons";

const COMPARISONS = [
  { others: "Optimize for volume", ours: "Optimize for positioning" },
  { others: "More leads, more noise", ours: "Fewer leads, higher quality" },
  { others: "Generic templates", ours: "Tailored premium messaging" },
  { others: "Built for everyone", ours: "Built for premium brands" },
];

export function DifferentiationSection() {
  const { ref, isVisible } = useInView();

  return (
    <section className="py-24 md:py-32">
      <div ref={ref} className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className={`text-center mb-16 ${isVisible ? "scroll-visible" : "scroll-hidden"}`}>
          <DiamondIcon className="text-indigo-400 mx-auto mb-6" />
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Why Us
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mt-4 max-w-2xl mx-auto">
            Most outreach tools optimize for volume. We optimize for positioning.
          </h2>
        </div>

        {/* Comparison rows */}
        <div className="space-y-3">
          {COMPARISONS.map((row, i) => (
            <div
              key={row.ours}
              className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${
                isVisible ? "scroll-visible" : "scroll-hidden"
              }`}
              style={{
                transitionDelay: isVisible ? `${i * 0.1}s` : "0s",
              }}
            >
              <div className="flex items-center gap-3 bg-zinc-800 rounded-xl px-4 py-3">
                <XIcon className="text-red-400 shrink-0" size={14} />
                <span className="text-sm text-zinc-500">{row.others}</span>
              </div>
              <div className="flex items-center gap-3 bg-zinc-900 border border-indigo-500/10 rounded-xl px-4 py-3">
                <CheckIcon className="text-emerald-400 shrink-0" size={14} />
                <span className="text-sm text-zinc-200">{row.ours}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Callout */}
        <div
          className={`mt-12 bg-zinc-900 border-l-2 border-indigo-500 rounded-xl px-6 py-5 ${
            isVisible ? "scroll-visible" : "scroll-hidden"
          }`}
          style={{ transitionDelay: isVisible ? "0.5s" : "0s" }}
        >
          <p className="text-lg text-zinc-200 italic">
            Booked 3 high-ticket clients in 2 weeks using this system.
          </p>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/landing/differentiation-section.tsx
git commit -m "feat: add differentiation section with comparison rows"
```

---

### Task 11: Pricing Section

**Files:**
- Create: `src/components/landing/pricing-section.tsx`

- [ ] **Step 1: Create the public pricing section component**

Create `src/components/landing/pricing-section.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useInView } from "./use-in-view";

export function PricingSection() {
  const { ref, isVisible } = useInView();

  return (
    <section id="pricing" className="py-24 md:py-32 bg-zinc-900/30">
      <div ref={ref} className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className={`text-center mb-16 ${isVisible ? "scroll-visible" : "scroll-hidden"}`}>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Pricing
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mt-4">
            Simple, transparent pricing
          </h2>
        </div>

        {/* Cards */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isVisible ? "scroll-visible" : "scroll-hidden"}`} style={{ transitionDelay: isVisible ? "0.2s" : "0s" }}>
          {/* Free */}
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-zinc-100 mb-1">Free</h3>
            <p className="text-3xl font-bold text-zinc-100 mb-1">
              €0<span className="text-sm font-normal text-zinc-500">/month</span>
            </p>
            <p className="text-xs text-zinc-500 mb-6">Get started with the basics</p>
            <ul className="space-y-2.5 text-sm text-zinc-400 mb-6">
              <li className="flex items-center gap-2.5">
                <CheckSvg />
                10 leads
              </li>
              <li className="flex items-center gap-2.5">
                <CheckSvg />
                CSV import
              </li>
              <li className="flex items-center gap-2.5">
                <CheckSvg />
                Analytics dashboard
              </li>
              <li className="flex items-center gap-2.5">
                <CheckSvg />
                URL-to-lead (5 uses)
              </li>
              <li className="flex items-center gap-2.5 text-zinc-600">
                <XSvg />
                AI-powered messages
              </li>
              <li className="flex items-center gap-2.5 text-zinc-600">
                <XSvg />
                Bulk URL import
              </li>
            </ul>
            <Link
              href="/register"
              className="block w-full text-center text-sm py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl transition-all"
            >
              Start Free
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-zinc-900/50 border border-indigo-500/40 rounded-2xl p-6">
            <span className="inline-block text-[10px] font-bold uppercase tracking-wide bg-indigo-500/15 text-indigo-400 px-2.5 py-1 rounded-lg mb-4">
              Most Popular
            </span>
            <h3 className="text-lg font-semibold text-zinc-100 mb-1">Pro</h3>
            <p className="text-3xl font-bold text-zinc-100 mb-1">
              €29<span className="text-sm font-normal text-zinc-500">/month</span>
            </p>
            <p className="text-xs text-zinc-500 mb-6">Unlimited outreach power</p>
            <ul className="space-y-2.5 text-sm text-zinc-400 mb-6">
              <li className="flex items-center gap-2.5">
                <CheckSvg />
                Unlimited leads
              </li>
              <li className="flex items-center gap-2.5">
                <CheckSvg />
                AI-powered messages
              </li>
              <li className="flex items-center gap-2.5">
                <CheckSvg />
                Bulk URL import
              </li>
              <li className="flex items-center gap-2.5">
                <CheckSvg />
                Unlimited URL-to-lead
              </li>
              <li className="flex items-center gap-2.5">
                <CheckSvg />
                Everything in Free
              </li>
            </ul>
            <Link
              href="/register"
              className="block w-full text-center text-sm py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function CheckSvg() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 shrink-0">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XSvg() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-700 shrink-0">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/landing/pricing-section.tsx
git commit -m "feat: add public pricing section for landing page"
```

---

### Task 12: CTA Section + Footer

**Files:**
- Create: `src/components/landing/cta-section.tsx`
- Create: `src/components/landing/footer.tsx`

- [ ] **Step 1: Create the CTA section component**

Create `src/components/landing/cta-section.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useInView } from "./use-in-view";

export function CtaSection() {
  const { ref, isVisible } = useInView();

  return (
    <section className="relative py-24 md:py-32">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div
        ref={ref}
        className={`relative max-w-2xl mx-auto px-4 sm:px-6 text-center ${
          isVisible ? "scroll-visible" : "scroll-hidden"
        }`}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-zinc-100">
          If your brand is premium, your outreach should be too.
        </h2>
        <p className="text-lg text-zinc-400 mt-4">
          Start building your client acquisition system today.
        </p>
        <div className="mt-8">
          <Link
            href="/register"
            className="inline-flex items-center px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-base transition-all hover:shadow-lg hover:shadow-indigo-500/20"
          >
            Start Free
          </Link>
          <p className="text-sm text-zinc-500 mt-3">No credit card required</p>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create the footer component**

Create `src/components/landing/footer.tsx`:

```tsx
export function Footer() {
  return (
    <footer className="bg-zinc-900/50 border-t border-zinc-800/50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm text-zinc-500">
          Outreach CRM &copy; {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/cta-section.tsx src/components/landing/footer.tsx
git commit -m "feat: add CTA section and footer"
```

---

### Task 13: Assemble Landing Page

**Files:**
- Modify: `src/app/landing/page.tsx`

- [ ] **Step 1: Wire all sections into the landing page**

Replace the contents of `src/app/landing/page.tsx` with:

```tsx
import type { Metadata } from "next";
import { NavHeader } from "@/components/landing/nav-header";
import { HeroSection } from "@/components/landing/hero-section";
import { ProblemSection } from "@/components/landing/problem-section";
import { SolutionSection } from "@/components/landing/solution-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { DifferentiationSection } from "@/components/landing/differentiation-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { CtaSection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Outreach CRM — Premium Client Acquisition System",
  description:
    "Turn your outreach into a predictable client acquisition machine. Built for high-end businesses that attract premium clients through organic content and strategic outreach.",
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-zinc-950">
      <NavHeader />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <HowItWorksSection />
      <DifferentiationSection />
      <PricingSection />
      <CtaSection />
      <Footer />
    </main>
  );
}
```

- [ ] **Step 2: Verify the full page renders**

Run: `npm run dev`

Open `http://localhost:3000/landing`. Verify:
- Nav header appears and gets backdrop blur on scroll
- All 7 sections render with correct content
- Scroll animations trigger as sections enter viewport
- Dashboard mockup appears in hero
- Footer shows at bottom

- [ ] **Step 3: Verify mobile responsiveness**

Open browser DevTools, toggle mobile view (375px width). Verify:
- Nav shows hamburger menu
- Hero stacks text above mockup
- How It Works cards stack vertically
- Comparison rows stack vertically
- Pricing cards stack vertically

- [ ] **Step 4: Commit**

```bash
git add src/app/landing/page.tsx
git commit -m "feat: assemble all sections into landing page"
```

---

### Task 14: Build Verification + Final Polish

**Files:**
- Possibly modify any file with type or lint errors

- [ ] **Step 1: Run the build**

```bash
cd /Users/jamelderrazi/Documents/outreach-crm && npm run build
```

Expected: Build succeeds with no TypeScript errors. Fix any errors that appear.

- [ ] **Step 2: Verify smooth scroll behavior**

Add `scroll-behavior: smooth` to the html element. In `src/app/globals.css`, add at the top after the `@import`:

```css
html {
  scroll-behavior: smooth;
}
```

- [ ] **Step 3: Run build again to confirm**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: finalize landing page with smooth scroll and build verification"
```
