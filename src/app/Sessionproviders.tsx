"use client";

import { useEffect } from "react";
import { SessionProvider, signOut, useSession } from "next-auth/react";

/**
 * Signs the user out once their refresh token is dead — expired, logged
 * out, or revoked by a password reset. The session keeps a stale access
 * token in that state, and every call made with it would fail.
 */
function SessionGuard() {
  const { data: session } = useSession();
  const failed = session?.error === "RefreshAccessTokenError";

  useEffect(() => {
    if (failed) signOut({ callbackUrl: "/login" });
  }, [failed]);

  return null;
}

export function Providers({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProvider>
      <SessionGuard />
      {children}
    </SessionProvider>
  );
}
