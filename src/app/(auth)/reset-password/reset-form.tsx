"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Stage = "checking" | "invalid" | "input" | "submitting" | "success";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [stage, setStage] = useState<Stage>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  // Validate token on mount — render a friendly error if it's expired
  // or already used, instead of letting the user type a new password first.
  useEffect(() => {
    if (!token) {
      setStage("invalid");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/auth/password-reset/confirm?token=${encodeURIComponent(token)}`,
          { method: "GET" },
        );
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        setStage(data.valid ? "input" : "invalid");
      } catch {
        if (!cancelled) setStage("invalid");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Redirect to login after success
  useEffect(() => {
    if (stage !== "success") return;
    const t = setTimeout(() => router.push("/login"), 2500);
    return () => clearTimeout(t);
  }, [stage, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setStage("submitting");

    try {
      const res = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to reset password.");
        setStage("input");
        return;
      }

      setStage("success");
    } catch {
      setError("Network error. Please try again.");
      setStage("input");
    }
  }

  if (stage === "checking") {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="inline-block w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (stage === "invalid") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">
            Link expired
          </h1>
          <p className="text-sm text-zinc-500 mt-1.5">
            This reset link is invalid or has already been used.
          </p>
        </div>
        <div className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
          Password reset links are valid for 1 hour and can only be used once.
        </div>
        <a
          href="/forgot-password"
          className="block w-full text-center py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-all"
        >
          Request a new link
        </a>
        <a
          href="/login"
          className="block text-center text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Back to sign in
        </a>
      </div>
    );
  }

  if (stage === "success") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">
            Password updated
          </h1>
          <p className="text-sm text-zinc-500 mt-1.5">
            Your password has been changed successfully.
          </p>
        </div>
        <div className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 animate-scale-in">
          Redirecting to sign in...
        </div>
        <a
          href="/login"
          className="block w-full text-center py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-all"
        >
          Sign in now
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">
          Choose a new password
        </h1>
        <p className="text-sm text-zinc-500 mt-1.5">
          Pick something you haven&apos;t used before.
        </p>
      </div>

      {error && (
        <div className="mb-6 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 animate-scale-in">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            New password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoFocus
            autoComplete="new-password"
            placeholder="Min 6 characters"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            Confirm password
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="Re-enter password"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 transition-colors"
          />
        </div>
        <div className="pt-1">
          <button
            type="submit"
            disabled={stage === "submitting"}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {stage === "submitting" && (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {stage === "submitting" ? "Updating..." : "Update password"}
          </button>
        </div>
      </form>
    </>
  );
}
