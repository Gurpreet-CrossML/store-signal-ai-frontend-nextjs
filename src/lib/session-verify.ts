import { ENDPOINTS } from "@/lib/config";
import type { Identity } from "@/lib/tenant-types";

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

/**
 * Refresh a session's tenant/identity claims from Django's profile endpoint.
 *
 * Grants, role (is_staff) and company membership can change server-side after a
 * token is issued, so the NextAuth `jwt` callback periodically re-pulls the
 * identity bundle (GET /api/auth/profile/) rather than trusting the claims
 * baked in at login. Same short cache + in-flight dedup as isSessionActive so
 * it costs at most one Django call per minute per token.
 *
 * Fails OPEN: any non-200 / network error returns null, and the caller keeps
 * the existing token claims (a Django hiccup must not strip a live session of
 * its tenant).
 */
const identityCache = new Map<string, { identity: Identity; expires: number }>();
const identityInFlight = new Map<string, Promise<Identity | null>>();

export async function refreshIdentity(
  accessToken: string | undefined,
): Promise<Identity | null> {
  if (!accessToken) return null;

  const cached = identityCache.get(accessToken);
  if (cached && cached.expires > Date.now()) return cached.identity;

  const existing = identityInFlight.get(accessToken);
  if (existing) return existing;

  const pending = fetchIdentity(accessToken).finally(() =>
    identityInFlight.delete(accessToken),
  );
  identityInFlight.set(accessToken, pending);
  return pending;
}

async function fetchIdentity(accessToken: string): Promise<Identity | null> {
  try {
    const res = await fetch(ENDPOINTS.profile(), {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null; // fail open — keep existing claims

    const data = await res.json();
    const d = data?.data ?? {};
    const identity: Identity = {
      company_code: d.company_code ?? null,
      is_staff: Boolean(d.is_staff),
      accessible_stores: Array.isArray(d.accessible_stores)
        ? d.accessible_stores
        : [],
    };

    if (identityCache.size >= MAX_CACHE_ENTRIES) identityCache.clear();
    identityCache.set(accessToken, {
      identity,
      expires: Date.now() + VERIFY_TTL_MS,
    });
    return identity;
  } catch {
    return null; // Django unreachable → fail open
  }
}
