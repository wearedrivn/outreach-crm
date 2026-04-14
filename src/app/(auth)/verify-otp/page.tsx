"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="inline-block w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VerifyOtpContent />
    </Suspense>
  );
}

function VerifyOtpContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get("uid") || "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [locked, setLocked] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if no userId
  useEffect(() => {
    if (!userId) {
      router.replace("/login");
    }
  }, [userId, router]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Start with 60s cooldown (code was just sent)
  useEffect(() => {
    setResendCooldown(60);
  }, []);

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];

    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      for (let i = 0; i < 6; i++) {
        newCode[i] = digits[i] || "";
      }
      setCode(newCode);
      const lastFilled = Math.min(digits.length - 1, 5);
      inputRefs.current[lastFilled]?.focus();
      return;
    }

    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerify() {
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setError("Please enter all 6 digits.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code: fullCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Verification failed.");
        if (data.locked) {
          setLocked(true);
        }
        setLoading(false);
        return;
      }

      // OTP verified — create the actual session
      const result = await signIn("credentials", {
        otpVerified: "true",
        userId,
        redirect: false,
      });

      if (result?.error) {
        setError("Failed to create session. Please try again.");
        setLoading(false);
        return;
      }

      router.replace("/");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;

    setResending(true);
    setError("");
    setLocked(false);

    try {
      const res = await fetch("/api/auth/otp/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to resend code.");
        setResending(false);
        return;
      }

      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      setResendCooldown(60);
    } catch {
      setError("Failed to resend code.");
    }
    setResending(false);
  }

  if (!userId) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="mb-10">
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">
            Check your email
          </h1>
          <p className="text-sm text-zinc-500 mt-1.5">
            We sent a 6-digit verification code to your email.
          </p>
        </div>

        {error && (
          <div className="mb-6 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 animate-scale-in">
            {error}
          </div>
        )}

        {/* OTP Input */}
        <div className="flex gap-2.5 justify-center mb-8">
          {code.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={loading || locked}
              className="w-12 h-14 text-center text-xl font-bold bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              autoFocus={i === 0}
            />
          ))}
        </div>

        <button
          onClick={handleVerify}
          disabled={loading || locked || code.join("").length !== 6}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && (
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          {loading ? "Verifying..." : "Verify Code"}
        </button>

        <div className="mt-6 text-center">
          <button
            onClick={handleResend}
            disabled={resending || resendCooldown > 0}
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resending
              ? "Sending..."
              : resendCooldown > 0
                ? `Resend code in ${resendCooldown}s`
                : "Resend code"}
          </button>
        </div>

        <p className="text-sm text-zinc-500 mt-8 text-center">
          <a
            href="/login"
            className="text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Back to login
          </a>
        </p>
      </div>
    </div>
  );
}
