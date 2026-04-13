import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

  if (!secret) {
    // No secret configured — can't verify sessions. Let the request
    // through so the app can at least render an error page rather than
    // a raw 500 from the proxy layer.
    console.error("[proxy] AUTH_SECRET is not set — skipping auth check");
    return NextResponse.next();
  }

  // NextAuth v5 uses "__Secure-authjs.session-token" on HTTPS and
  // "authjs.session-token" on HTTP. Tell getToken which to look for.
  const secureCookie =
    request.url.startsWith("https://") ||
    request.headers.get("x-forwarded-proto") === "https";

  let token = null;
  try {
    token = await getToken({ req: request, secret, secureCookie });
  } catch (err) {
    // If JWT decoding fails (corrupted cookie, wrong secret, etc.)
    // treat the user as unauthenticated rather than crashing.
    console.error("[proxy] getToken failed:", (err as Error).message);
  }

  if (!token) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!login|register|api/auth|api/diag|api/stripe/webhook|_next/static|_next/image|favicon.ico).*)",
  ],
};
