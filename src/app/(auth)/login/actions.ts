"use server";

import { redirect } from "next/navigation";

export type LoginState = {
  error: string | null;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    return { error: "Email and password are required." };
  }

  // Call our OTP send endpoint (server-to-server, using absolute URL construction)
  const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/api/auth/otp/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch (err) {
    console.error("[loginAction] fetch error:", (err as Error).message);
    return { error: "Service unavailable. Please try again." };
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (data.cooldown) {
      return { error: "Please wait before requesting a new code." };
    }
    return { error: data.error || "Invalid email or password." };
  }

  // Redirect to OTP verification page with userId
  redirect(`/verify-otp?uid=${data.userId}`);
}
