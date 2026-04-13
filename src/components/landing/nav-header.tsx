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
