import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const clientId = process.env.OUTLOOK_OAUTH_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL("/connections?error=outlook_not_configured", request.url));
  }

  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/connections/outlook/callback`;
  const state = randomBytes(16).toString("hex");

  const authUrl = new URL("https://login.microsoftonline.com/common/oauth2/v2.0/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("response_mode", "query");
  authUrl.searchParams.set(
    "scope",
    "openid email offline_access https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read",
  );
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "select_account");

  const res = NextResponse.redirect(authUrl.toString());
  res.cookies.set("oauth_state_outlook", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: origin.startsWith("https://"),
    maxAge: 600,
    path: "/",
  });
  return res;
}
