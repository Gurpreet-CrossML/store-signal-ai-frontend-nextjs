import CredentialsProvider from "next-auth/providers/credentials";
import NextAuth from "next-auth/next";
import type { AuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import jwt from "jsonwebtoken";
import { ENDPOINTS } from "@/lib/config";
import { refreshIdentity } from "@/lib/session-verify";
import type {
  AccessibleStore,
  PermissionMap,
  StaffRole,
} from "@/lib/tenant-types";

declare module "next-auth" {
  interface User {
    token?: string;
    refresh?: string;
    email?: string;
    username?: string;
    name?: string;
    // Tenancy/identity from the Django login `data` (see account/serializers.py).
    company_code?: string | null;
    is_staff?: boolean;
    role?: StaffRole | null;
    permissions?: PermissionMap;
    accessible_stores?: AccessibleStore[];
    // Onboarding flow: if the user has not yet completed the initial setup, we
    // redirect them to the onboarding flow instead of the dashboard.
    onboarding_pending?: boolean;
    onboarding_step?: string | null;
  }
  interface Session {
    user: {
      email?: string | null;
      username?: string;
      name?: string | null;
      access_token?: string;
      // Tenant routing + access (read by withTenantRoute and the UI gates).
      company_code?: string | null;
      is_staff?: boolean;
      role?: StaffRole | null;
      permissions?: PermissionMap;
      accessible_stores?: AccessibleStore[];
      // Onboarding flow: if the user has not yet completed the initial setup, we
      // redirect them to the onboarding flow instead of the dashboard.
      onboarding_pending?: boolean;
      onboarding_step?: string | null;
    };
    // Propagated from the JWT when a token refresh fails, so the client can
    // prompt re-authentication.
    error?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    access_token?: string;
    refresh_token?: string;
    accessTokenExpires?: number;
    email?: string;
    username?: string;
    name?: string;
    company_code?: string | null;
    is_staff?: boolean;
    role?: StaffRole | null;
    permissions?: PermissionMap;
    accessible_stores?: AccessibleStore[];
    onboarding_pending?: boolean;
    onboarding_step?: string | null;
    // Set when a refresh attempt fails; the client treats it as a signal to
    // re-authenticate (the stale access token will start returning 401s).
    error?: string;
  }
}

// How long before the access token expires it is refreshed.
const REFRESH_MARGIN_MS = 60_000;

// Decode a JWT and return its expiry in milliseconds, if present.
function getTokenExpiry(token?: string): number | undefined {
  if (!token) return undefined;
  const decoded = jwt.decode(token);
  if (
    decoded &&
    typeof decoded !== "string" &&
    typeof decoded.exp === "number"
  ) {
    return decoded.exp * 1000;
  }
  return undefined;
}

// Exchange the refresh token for a fresh access token via Django's SimpleJWT
// endpoint (POST /api/auth/token/refresh/ — body { refresh }, returns { access }
// under the standard { status, message, data } envelope).
//
// Only Django saying the refresh token is dead (401, or 400 for a missing one)
// flags `error`, which makes SessionGuard sign the user out. A network error
// or 5xx keeps the token as it is and the next session read retries, so a
// short backend outage does not log everyone out.
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const res = await fetch(ENDPOINTS.refreshToken(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: token.refresh_token }),
    });

    if (res.status === 401 || res.status === 400) {
      return { ...token, error: "RefreshAccessTokenError" };
    }
    if (!res.ok) {
      console.error("Failed to refresh access token:", res.statusText);
      return token;
    }

    const data = await res.json();
    const access: string | undefined = data?.data?.access;
    if (!access) {
      return token;
    }

    return {
      ...token,
      access_token: access,
      accessTokenExpires: getTokenExpiry(access),
      error: undefined,
    };
  } catch (error) {
    console.error("Error refreshing access token:", error);
    return token;
  }
}

export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    // error: "/error",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const res = await fetch(ENDPOINTS.login(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        });

        if (res.status === 500) {
          throw new Error("Server error");
        }

        const data = await res.json();

        if (res.ok && data?.data) {
          // Platform superusers must NEVER access the dashboard. Reject them at
          // login so they never receive a session — only company admins
          // (is_staff=true) and staff (is_staff=false) are allowed in.
          if (data.data.is_superuser) {
            throw new Error("Superuser accounts cannot access the dashboard.");
          }
          return data.data;
        }
        throw new Error(JSON.stringify(data));
      },
    }),
  ],
  events: {
    // End the session on Django too, not just in this cookie: its access and
    // refresh tokens would otherwise keep working until they expire. Runs on
    // the server, where the refresh token is. Best-effort — a failure here
    // (e.g. the token was already revoked) must not block signing out.
    async signOut({ token }) {
      if (!token?.access_token) return;
      try {
        await fetch(ENDPOINTS.logout(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token.access_token}`,
          },
          body: JSON.stringify({ refresh: token.refresh_token }),
        });
      } catch (error) {
        console.error("Django logout failed:", error);
      }
    },
  },
  callbacks: {
    async session({ session, token }) {
      session = {
        ...session,
        error: token.error,
        user: {
          email: token.email,
          username: token.username,
          name: token.name,
          access_token: token.access_token,
          company_code: token.company_code,
          is_staff: token.is_staff,
          role: token.role,
          permissions: token.permissions,
          accessible_stores: token.accessible_stores,
          onboarding_pending: token.onboarding_pending,
          onboarding_step: token.onboarding_step,
        },
      };
      return session;
    },

    // Store all data in the JWT (internal only)
    async jwt({ token, user, trigger }) {
      // On initial login
      if (user) {
        token.access_token = user.token;
        token.refresh_token = user.refresh;
        token.accessTokenExpires = getTokenExpiry(user.token);

        token.email = user.email;
        token.username = user.username;
        token.name = user.name;

        // Tenancy/identity persisted from the Django login response, so every
        // request can resolve its tenant + per-store access from the session.
        token.company_code = user.company_code ?? null;
        token.is_staff = user.is_staff ?? false;
        token.role = user.role ?? null;
        token.permissions = user.permissions ?? {};
        token.accessible_stores = user.accessible_stores ?? [];

        token.onboarding_pending = user.onboarding_pending ?? false;
        token.onboarding_step = user.onboarding_step ?? null;

        return token;
      }

      // Refresh a minute before expiry, not after: a request sent with a
      // token on its last second can arrive expired, and its 401 signs the
      // user out. A refresh that already failed is not retried on every
      // read — SessionGuard signs the user out instead.
      if (
        !token.error &&
        token.accessTokenExpires &&
        Date.now() > token.accessTokenExpires - REFRESH_MARGIN_MS
      ) {
        token = await refreshAccessToken(token);
      }

      // Keep tenant/identity claims fresh — role, permissions and company
      // can change server-side after login. Cached (≤1 call/min/token) and
      // fails open to the existing claims on any error.
      const identity = await refreshIdentity(token.access_token, {
        fresh: trigger === "update",
      });
      if (identity) {
        token.company_code = identity.company_code;
        token.is_staff = identity.is_staff;
        token.role = identity.role;
        token.permissions = identity.permissions;
        token.accessible_stores = identity.accessible_stores;
        if (identity.onboarding_pending !== undefined) {
          token.onboarding_pending = identity.onboarding_pending;
          token.onboarding_step = identity.onboarding_step ?? null;
        }
      }

      return token;
    },
  },
};

export default NextAuth(authOptions);
