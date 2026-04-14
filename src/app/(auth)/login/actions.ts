"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

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

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
    return { error: null };
  } catch (e) {
    if (
      e &&
      typeof e === "object" &&
      "digest" in e &&
      typeof (e as { digest?: string }).digest === "string" &&
      (e as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw e;
    }

    if (e instanceof AuthError) {
      console.error("[loginAction] AuthError:", e.type, e.message);
      if (e.type === "CredentialsSignin") {
        return { error: "Invalid email or password." };
      }
      return { error: `Auth error: ${e.type}` };
    }

    const err = e as Error;
    console.error("[loginAction] Unknown error:", {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
    return { error: `Login crashed: ${err.message}` };
  }
}
