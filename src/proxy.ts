import { NextRequest, NextResponse } from "next/server";

import { getToken } from "next-auth/jwt";

// Next.js 16 renamed Middleware → Proxy (see node_modules/next/dist/docs/.../proxy.md).
// Proxy runs on the Node.js runtime and is meant for FAST, optimistic checks —
// not slow data fetching or full session management. So this only does the
// optimistic auth gate (is there a session at all?). The authoritative check
// that the session is still valid server-side — i.e. the company-deactivation
// cascade via Django verify-token — lives in the Node route layer
// (src/lib/with-tenant-route.ts → src/lib/session-verify.ts), where a fetch is
// appropriate and its result can be cached.

// List of routes for unauthenticated users (auth pages)
const authRoutes = ["/login", "/register"];

// Routes reachable with OR without a session, and never redirected either way.
// The Shopify OAuth new tab returns to these after a cross-origin hop through
// Shopify + the Django callback; the session cookie may not ride that chain, so
// they can't be protected — and they can't be `authRoutes` either, which would
// bounce the (authenticated) merchant to the dashboard. They expose nothing
// secret: they just show the result and broadcast it to the onboarding tab.
const publicRoutes = ["/onboarding/connected", "/onboarding/connect-error"];

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Public OAuth landing pages: always allowed, no redirect in either direction.
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // API routes (the ported GET endpoints) require a valid session. Respond with
  // 401 JSON instead of redirecting (NextAuth's own /api/auth/* is excluded by
  // the matcher, and writes go to Django, not here).
  if (pathname.startsWith("/api/")) {
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication credentials were not provided.",
          data: null,
        },
        { status: 401 },
      );
    }
    return NextResponse.next();
  }

  // Authenticated user trying to access auth pages → redirect to /dashboard
  if (token && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Unauthenticated user trying to access protected route → redirect to /login
  const isProtected = !authRoutes.includes(pathname);
  if (!token && isProtected) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Otherwise, allow the request to continue
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all pages AND api routes, except: NextAuth endpoints (/api/auth/*),
    // Next internals, and any file with an extension (public assets: .svg, .png, etc.)
    "/((?!api/auth|_next|static|.*\\..*).*)",
  ],
};
