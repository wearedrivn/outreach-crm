"use client";

import { useState } from "react";

type Stage = "input" | "submitting" | "success";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [stage, setStage] = useState<Stage>("input");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;

    setStage("submitting");
    setError("");

    try {
      const res = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Something went wrong. Try again.");
        setStage("input");
        return;
      }

      setStage("success");
    } catch {
      setError("Network error. Please try again.");
      setStage("input");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="mb-10">
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">
            Forgot password
          </h1>
          <p className="text-sm text-zinc-500 mt-1.5">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {stage === "success" ? (
          <div className="space-y-6">
            <div className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 animate-scale-in">
              If an account exists, we sent you a reset link.
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Check your inbox (and spam folder). The link expires in 1 hour.
            </p>
            <a
              href="/login"
              className="block text-center text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Back to sign in
            </a>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-6 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 animate-scale-in">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  autoComplete="email"
                  placeholder="you@company.com"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 transition-colors"
                />
              </div>
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={stage === "submitting" || !email.trim()}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {stage === "submitting" && (
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {stage === "submitting" ? "Sending..." : "Send reset link"}
                </button>
              </div>
            </form>

            <p className="text-sm text-zinc-500 mt-8 text-center">
              Remembered it?{" "}
              <a
                href="/login"
                className="text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Sign in
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
