import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/connections?error=${encodeURIComponent(error)}`, request.url));
  }
  if (!code) {
    return NextResponse.redirect(new URL("/connections?error=no_code", request.url));
  }

  const cookieStore = await cookies();
  const stored = cookieStore.get("oauth_state_gmail")?.value;
  if (!stored || stored !== state) {
    return NextResponse.redirect(new URL("/connections?error=state_mismatch", request.url));
  }

  const clientId = process.env.GMAIL_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GMAIL_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/connections?error=gmail_not_configured", request.url));
  }

  const redirectUri = `${url.origin}/api/connections/gmail/callback`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    console.error("[gmail callback] token exchange failed:", text);
    return NextResponse.redirect(new URL("/connections?error=token_exchange_failed", request.url));
  }

  const tokens = (await tokenRes.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope: string;
  };

  // Fetch the user's email from Google
  const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!userInfoRes.ok) {
    return NextResponse.redirect(new URL("/connections?error=userinfo_failed", request.url));
  }
  const userInfo = (await userInfoRes.json()) as { email: string };
  const email = userInfo.email;

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  await prisma.emailConnection.upsert({
    where: {
      userId_provider: {
        userId: session.user.id,
        provider: "gmail",
      },
    },
    create: {
      userId: session.user.id,
      provider: "gmail",
      email,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      tokenExpiresAt: expiresAt,
      scope: tokens.scope,
      status: "active",
    },
    update: {
      email,
      accessToken: tokens.access_token,
      ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
      tokenExpiresAt: expiresAt,
      scope: tokens.scope,
      status: "active",
      lastError: null,
    },
  });

  const res = NextResponse.redirect(new URL("/connections?connected=gmail", request.url));
  res.cookies.delete("oauth_state_gmail");
  return res;
}
