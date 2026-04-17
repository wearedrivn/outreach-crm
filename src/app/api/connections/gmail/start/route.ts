import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const clientId = process.env.GMAIL_OAUTH_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL("/connections?error=gmail_not_configured", request.url));
  }

  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/connections/gmail/callback`;
  const state = randomBytes(16).toString("hex");

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set(
    "scope",
    "openid email profile https://www.googleapis.com/auth/gmail.send",
  );
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", state);

  const res = NextResponse.redirect(authUrl.toString());
  res.cookies.set("oauth_state_gmail", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: origin.startsWith("https://"),
    maxAge: 600,
    path: "/",
  });
  return res;
}
