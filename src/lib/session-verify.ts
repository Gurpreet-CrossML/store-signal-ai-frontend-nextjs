import { ENDPOINTS } from "@/lib/config";
import type { Identity } from "@/lib/tenant-types";

/**
 * Keeps a session's tenant/identity claims in step with Django.
 *
 * Grants, role (is_staff) and company membership can change server-side after
 * a token is issued, so the NextAuth `jwt` callback periodically re-pulls the
 * identity bundle (GET /api/auth/profile/) rather than trusting the claims
 * baked in at login. Cached with an in-flight dedup so it costs at most one
 * Django call per minute per token.
 *
 * Fails OPEN: any non-200 / network error returns null, and the caller keeps
 * the existing token claims (a Django hiccup must not strip a live session of
 * its tenant).
 */

const VERIFY_TTL_MS = 60_000;
const MAX_CACHE_ENTRIES = 1000;

const identityCache = new Map<
  string,
  { identity: Identity; expires: number }
>();
const identityInFlight = new Map<string, Promise<Identity | null>>();

export async function refreshIdentity(
  accessToken: string | undefined,
  // `fresh` skips the cache — used when the client knows something changed
  // (e.g. onboarding advanced after a store connect) and calls session.update().
  { fresh = false } = {},
): Promise<Identity | null> {
  if (!accessToken) return null;

  const cached = identityCache.get(accessToken);
  if (!fresh && cached && cached.expires > Date.now()) return cached.identity;

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
    if (typeof d.onboarding_pending === "boolean") {
      identity.onboarding_pending = d.onboarding_pending;
      identity.onboarding_step = d.onboarding_step ?? null;
    }

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
