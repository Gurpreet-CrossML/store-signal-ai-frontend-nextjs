import { NextRequest, NextResponse } from "next/server";

import { getToken } from "next-auth/jwt";

// List of routes for unauthenticated users (auth pages)
const authRoutes = ["/login",];

export async function middleware(req: NextRequest) {
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

    // Otherwise, allow the request to continue
    return NextResponse.next();
}


export const config = {
    matcher: [
        // Match all except API, Next internals, and any file with an extension (public assets: .svg, .png, etc.)
        "/((?!api|_next|static|.*\\..*).*)",
    ],
};
