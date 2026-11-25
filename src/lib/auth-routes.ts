/**
 * Pages that live outside the dashboard: no sidebar, no session needed.
 *
 * Read by the proxy (who may open them) and the main layout (no app chrome),
 * so the two can never disagree about which pages these are.
 */

/** Sign-in pages; a signed-in user is sent to the dashboard instead. */
export const SIGNED_OUT_ROUTES = ["/login", "/signup", "/forgot-password"];

/**
 * Open to everyone, signed in or not. A reset link must work even in a
 * browser that still holds a session — bouncing it would waste the link.
 */
const PUBLIC_PREFIXES = ["/reset-password/"];

export function isSignedOutRoute(pathname: string): boolean {
  return SIGNED_OUT_ROUTES.includes(pathname);
}

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/** Rendered without the dashboard's sidebar and store loading. */
export function isAuthPage(pathname: string | null): boolean {
  return Boolean(
    pathname && (isSignedOutRoute(pathname) || isPublicRoute(pathname)),
  );
}
