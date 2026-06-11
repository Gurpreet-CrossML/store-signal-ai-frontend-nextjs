import { NextRequest, NextResponse } from "next/server";

import { getToken } from "next-auth/jwt";

// List of routes for unauthenticated users (auth pages)
const authRoutes = ["/login"];

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

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
