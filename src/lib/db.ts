import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";
import fs from "fs";
import path from "path";


const databaseUrl = new URL(process.env.DATABASE_URL!);
databaseUrl.searchParams.delete("sslmode");
databaseUrl.searchParams.delete("channel_binding");

function sslConfig(): PoolConfig["ssl"] {
  if (
    databaseUrl.hostname === "localhost" ||
    databaseUrl.hostname === "127.0.0.1"
  ) {
    return undefined;
  }
  if (databaseUrl.hostname.endsWith(".neon.tech")) {
    return { rejectUnauthorized: false };
  }
  return {
    ca: fs
      .readFileSync(path.join(process.cwd(), "global-bundle.pem"))
      .toString(),
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined,
  };
}

export const pool = new Pool({
  connectionString: databaseUrl.toString(),
  ssl: sslConfig(),
});

export const db = drizzle(pool);