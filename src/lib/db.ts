"use server";

import { drizzle } from "drizzle-orm/node-postgres";

// The current pg-connection-string treats sslmode=require/prefer as `verify-full`,
// which breaks managed Postgres like Neon with UNABLE_TO_GET_ISSUER_CERT_LOCALLY in
// runtimes that can't resolve the issuer cert — even though these modes historically
// meant "encrypt, but don't verify the cert". Map them back to `no-verify` to restore
// that behaviour, while leaving `disable` (plain TCP) and the explicit verify-ca/
// verify-full modes untouched, so each host's sslmode in DATABASE_URL still wins.
const databaseUrl = new URL(process.env.DATABASE_URL!);
const sslmode = databaseUrl.searchParams.get("sslmode");
if (sslmode === "require" || sslmode === "prefer") {
  databaseUrl.searchParams.set("sslmode", "no-verify");
}

// Initialize Drizzle ORM with PostgreSQL connection
export const db = drizzle({ connection: databaseUrl.toString() });
