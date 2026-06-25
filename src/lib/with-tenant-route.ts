import type { NextApiHandler } from "next";
import { getServerSession } from "next-auth";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { createAPIResponse, handleApiError } from "@/lib/helpers";
import { runWithTenant } from "@/lib/tenant-context";
import { buildAccess, resolveTenant } from "@/lib/access-rules";
import { isSessionActive } from "@/lib/session-verify";

/**
 * Wrap a Pages-Router API handler so it runs inside its session's tenant scope.
 *
 * Establishes the tenant context once at the route boundary: reads the NextAuth
 * session, resolves the tenant, and runs the handler under
 * `runWithTenant(...)` — so every `getDb()` call inside `src/db/*` hits the
 * right schema. The handler itself stays unchanged.
 */
export function withTenantRoute(handler: NextApiHandler): NextApiHandler {
  return async (req, res) => {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res
        .status(401)
        .json(createAPIResponse(false, "Authentication required.", null));
    }

    // Authoritative session check (company-deactivation cascade): confirm the
    // Django access token is still valid + the user still active. Cached, so at
    // most one Django round-trip per minute per session. A 401 here trips the
    // client's axios interceptor, which signs the user out.
    if (!(await isSessionActive(session.user?.access_token))) {
      return res
        .status(401)
        .json(createAPIResponse(false, "Session is no longer valid.", null));
    }

    const companyCode = resolveTenant(session.user);
    if (!companyCode) {
      // Authenticated but no tenant to scope to (a user with no active company
      // membership — e.g. a platform account that shouldn't be in the dashboard).
      return res
        .status(403)
        .json(createAPIResponse(false, "No tenant for this session.", null));
    }

    // Central backstop: any error escaping the handler (or the tenant
    // transaction) is logged server-side and returned as a generic 500 — never
    // the raw DB error, which would leak the SQL + params.
    try {
      return await runWithTenant(
        companyCode,
        buildAccess(session.user),
        async () => {
          await handler(req, res);
        },
      );
    } catch (err) {
      return handleApiError(res, err, `${req.method} ${req.url}`);
    }
  };
}
