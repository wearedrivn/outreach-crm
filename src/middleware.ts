import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  // NextAuth v5 uses "authjs.session-token" on HTTP and
  // "__Secure-authjs.session-token" on HTTPS. We must tell getToken
  // whether the request is secure so it looks for the right cookie.
  const secureCookie =
    request.url.startsWith("https://") ||
    request.headers.get("x-forwarded-proto") === "https";

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie,
  });

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
    "/((?!login|register|api/auth|api/diag|_next/static|_next/image|favicon.ico).*)",
  ],
};
