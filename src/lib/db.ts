"use server";

import { drizzle } from "drizzle-orm/node-postgres";

// `pg` parses the connection string and lets its `sslmode` override any `ssl`
// option we pass, and the current pg-connection-string treats `sslmode=require`
// as `verify-full` — which fails against Neon with UNABLE_TO_GET_ISSUER_CERT_LOCALLY
// in runtimes that can't resolve the issuer cert. Force `sslmode=no-verify` so SSL
// config has a single committed source of truth regardless of DATABASE_URL: the
// connection stays encrypted (and MITM-protected via SCRAM channel binding) without
// local CA verification.
const databaseUrl = new URL(process.env.DATABASE_URL!);
databaseUrl.searchParams.set("sslmode", "no-verify");

// Initialize Drizzle ORM with PostgreSQL connection
export const db = drizzle({ connection: databaseUrl.toString() });
