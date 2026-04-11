"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);

    // Hard 15s timeout so the UI never hangs forever
    const timeout = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 15000)
    );

    let res: Awaited<ReturnType<typeof signIn>> | null = null;
    try {
      res = (await Promise.race([
        signIn("credentials", {
          email: form.get("email"),
          password: form.get("password"),
          redirect: false,
        }),
        timeout,
      ])) as Awaited<ReturnType<typeof signIn>> | null;
    } catch (err) {
      setError(`Sign-in crashed: ${(err as Error).message}`);
      setLoading(false);
      return;
    }

    if (res === null) {
      setError(
        "Sign-in timed out after 15s. The auth endpoint is not responding — check Vercel function logs and confirm AUTH_SECRET is set."
      );
      setLoading(false);
      return;
    }

    if (res?.error) {
      setError(`Sign-in failed: ${res.error}${res.code ? ` (${res.code})` : ""}`);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-zinc-100 mb-1">Sign in</h1>
        <p className="text-sm text-zinc-500 mb-8">
          Access your outreach dashboard.
        </p>

        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Password</label>
            <input
              name="password"
              type="password"
              required
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-sm text-zinc-500 mt-6 text-center">
          No account?{" "}
          <a href="/register" className="text-indigo-400 hover:text-indigo-300">
            Create one
          </a>
        </p>
      </div>
    </div>
  );
}
