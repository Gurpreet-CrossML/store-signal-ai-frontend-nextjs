import { NextRequest, NextResponse } from "next/server";

import { getToken } from "next-auth/jwt";

// Next.js 16 renamed Middleware → Proxy (see node_modules/next/dist/docs/.../proxy.md).
// Proxy runs on the Node.js runtime and is meant for FAST, optimistic checks —
// not slow data fetching or full session management. So this only does the
// optimistic auth gate (is there a session at all?): every API call goes to
// Django, which authenticates it for itself.

// List of routes for unauthenticated users (auth pages)
const authRoutes = ["/login", "/signup"];

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Authenticated user trying to access auth pages → redirect to /dashboard
  if (token && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Unauthenticated user trying to access protected route → redirect to /login
  const isProtected = !authRoutes.includes(pathname);
  if (!token && isProtected) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Onboarding not finished → the user is pinned to "/" where the onboarding
  // drawer opens. Every other page (deep links, back button, typed URLs)
  // bounces here, so nothing else is reachable until setup is done — and
  // Shopify's OAuth return always lands on the page that finishes it. The
  // query string is kept so those OAuth params survive the bounce.
  if (token?.onboarding_pending && pathname !== "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Otherwise, allow the request to continue
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match pages only. NextAuth (/api/auth/*) is the sole route left under
    // /api and authenticates itself; Next internals and any file with an
    // extension (public assets: .svg, .png, etc.) are skipped too.
    "/((?!api|_next|static|.*\\..*).*)",
  ],
};
