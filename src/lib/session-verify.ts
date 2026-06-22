import { ENDPOINTS } from "@/lib/config";

/**
 * Server-side session validity check against Django's verify-token, used to
 * enforce the company-deactivation cascade on the dashboard data plane.
 *
 * Why here and not in proxy.ts: Next 16 Proxy is for fast, optimistic checks —
 * not slow fetches or session management (and it shouldn't rely on globals). So
 * the authoritative check runs in the Node route layer (withTenantRoute), once
 * per request, with a short in-memory cache so it's at most one Django call per
 * minute per session rather than one per request.
 *
 * Django's POST /api/auth/token/verify/ returns 200 for a live session and 401
 * when the access token is invalid/expired OR the user is inactive (the
 * deactivation cascade sets auth_user.is_active=False). Access tokens live 7
 * days, so within a session a 401 means deactivation, not mere expiry.
 *
 * Availability bias: a 401 is the only signal we treat as "inactive". Network
 * errors / 5xx fail OPEN — the dashboard data plane is Drizzle/Node and doesn't
 * depend on Django, so a Django hiccup must not lock everyone out.
 */

type CacheEntry = { active: boolean; expires: number };

const VERIFY_TTL_MS = 60_000;
const MAX_CACHE_ENTRIES = 1000;
const cache = new Map<string, CacheEntry>();
// In-flight verifications, so concurrent requests with the same token (e.g. the
// dashboard's parallel calls) share ONE Django round-trip instead of N.
const inFlight = new Map<string, Promise<boolean>>();

export async function isSessionActive(
  accessToken: string | undefined,
): Promise<boolean> {
  if (!accessToken) return false;

  const cached = cache.get(accessToken);
  if (cached && cached.expires > Date.now()) return cached.active;

  const existing = inFlight.get(accessToken);
  if (existing) return existing;

  const pending = verifyAndCache(accessToken).finally(() =>
    inFlight.delete(accessToken),
  );
  inFlight.set(accessToken, pending);
  return pending;
}

async function verifyAndCache(accessToken: string): Promise<boolean> {
  let active: boolean;
  try {
    const res = await fetch(ENDPOINTS.verifyToken(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: accessToken }),
    });
    if (res.status === 401) {
      active = false; // invalid/expired token or deactivated user
    } else if (res.ok) {
      active = true;
    } else {
      return true; // unexpected backend status → fail open, don't cache
    }
  } catch {
    return true; // Django unreachable → fail open, don't cache
  }

  // Simple bound: drop everything once it grows too large (entries are short-lived).
  if (cache.size >= MAX_CACHE_ENTRIES) cache.clear();
  cache.set(accessToken, { active, expires: Date.now() + VERIFY_TTL_MS });
  return active;
}
