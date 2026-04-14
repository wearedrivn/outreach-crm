"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";

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

  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true, passwordHash: true },
  });

  if (!user) {
    return { error: "Invalid email or password." };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: "Invalid email or password." };
  }

  // Generate OTP
  const code = await createOtp(user.id);
  if (!code) {
    return { error: "Please wait before requesting a new code." };
  }

  // Send email
  try {
    await sendOtpEmail(user.email, code);
  } catch (err) {
    console.error("[loginAction] Failed to send OTP email:", (err as Error).message);
    return { error: "Failed to send verification email. Please try again." };
  }

  redirect(`/verify-otp?uid=${user.id}`);
}
