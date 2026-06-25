import CredentialsProvider from "next-auth/providers/credentials";
import NextAuth from "next-auth/next";
import type { AuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import jwt from "jsonwebtoken";
import { ENDPOINTS } from "@/lib/config";
import { refreshIdentity } from "@/lib/session-verify";
import type { AccessibleStore } from "@/lib/tenant-types";

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
    accessible_stores?: AccessibleStore[];
  }
  interface Session {
    user: {
      email?: string | null;
      username?: string;
      name?: string | null;
      access_token?: string;
      // Tenant routing + per-store access (read by withTenantRoute / resolveAccess).
      company_code?: string | null;
      is_staff?: boolean;
      accessible_stores?: AccessibleStore[];
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
    accessible_stores?: AccessibleStore[];
    // Set when a refresh attempt fails; the client treats it as a signal to
    // re-authenticate (the stale access token will start returning 401s).
    error?: string;
  }
}

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
// under the standard { status, message, data } envelope). On any failure we
// keep the existing claims and flag `error` instead of wiping the token, so a
// transient backend issue doesn't silently destroy the session.
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const res = await fetch(ENDPOINTS.refreshToken(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: token.refresh_token }),
    });

    if (!res.ok) {
      console.error("Failed to refresh access token:", res.statusText);
      return { ...token, error: "RefreshAccessTokenError" };
    }

    const data = await res.json();
    const access: string | undefined = data?.data?.access;
    if (!access) {
      return { ...token, error: "RefreshAccessTokenError" };
    }

    return {
      ...token,
      access_token: access,
      accessTokenExpires: getTokenExpiry(access),
      error: undefined,
    };
  } catch (error) {
    console.error("Error refreshing access token:", error);
    return { ...token, error: "RefreshAccessTokenError" };
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
          accessible_stores: token.accessible_stores,
        },
      };
      return session;
    },

    // Store all data in the JWT (internal only)
    async jwt({ token, user }) {
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
        token.accessible_stores = user.accessible_stores ?? [];

        return token;
      }

      // If the access token has expired, refresh it.
      if (token.accessTokenExpires && Date.now() > token.accessTokenExpires) {
        token = await refreshAccessToken(token);
      }

      // Keep tenant/identity claims fresh — role, company and per-store grants
      // can change server-side after login. Cached (≤1 call/min/token) and
      // fails open to the existing claims on any error.
      const identity = await refreshIdentity(token.access_token);
      if (identity) {
        token.company_code = identity.company_code;
        token.is_staff = identity.is_staff;
        token.accessible_stores = identity.accessible_stores;
      }

      return token;
    },
  },
};

export default NextAuth(authOptions);
