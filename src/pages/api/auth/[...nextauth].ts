import CredentialsProvider from "next-auth/providers/credentials";
import NextAuth from "next-auth/next";
import type { AuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import jwt from "jsonwebtoken";
import { ENDPOINTS } from "@/lib/config";

declare module "next-auth" {
  interface User {
    token?: string;
    refresh?: string;
    email?: string;
    username?: string;
    name?: string;
  }
  interface Session {
    user: {
      email?: string | null;
      username?: string;
      name?: string | null;
      access_token?: string;
    };
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

// Refresh access token function
// async function refreshAccessToken(token: JWT): Promise<JWT> {
//     try {
//         const url = ENDPOINTS.login();
//         const res = await fetch(url, {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//             },
//             body: JSON.stringify({
//                 refresh_token: token.refresh_token,
//             }),
//         });

//         if (!res.ok) {
//             console.error("Failed to refresh access token:", res.statusText);
//             return {};
//         }

//         const data = await res.json();

//         return {
//             ...token,
//             access_token: data?.data?.token,
//             accessTokenExpires: getTokenExpiry(data?.data?.token),
//         };
//     } catch (error) {
//         console.error("Error refreshing access token:", error);
//         return {};
//     }
// }

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
          return data?.data;
        } else {
          throw new Error(JSON.stringify(data));
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      session = {
        ...session,
        user: {
          email: token.email,
          username: token.username,
          name: token.name,
          access_token: token.access_token,
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
      }

      // If token expired, refresh it
      if (token.accessTokenExpires && Date.now() > token.accessTokenExpires) {
        // token = await refreshAccessToken(token);
      }

      return token;
    },
  },
};

export default NextAuth(authOptions);
