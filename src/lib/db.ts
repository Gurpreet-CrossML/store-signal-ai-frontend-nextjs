"use server";

import { drizzle } from "drizzle-orm/node-postgres";
import fs from "fs";
import path from "path";

// The database is an Amazon RDS instance reached through an nginx TCP passthrough,
// so it presents RDS's own certificate (CN: *.rds.amazonaws.com) — which never
// matches the proxy host we connect through (store-signal-api.crossml.in). We
// verify the cert chain against Amazon's RDS CA bundle (proves it's a genuine RDS
// cert and blocks MITM) but skip the hostname check, which can't pass through the
// proxy. sslmode is stripped from the URL because pg lets the connection string's
// sslmode override — and discard — this ssl config.
const databaseUrl = new URL(process.env.DATABASE_URL!);
databaseUrl.searchParams.delete("sslmode");

export const db = drizzle({
  connection: {
    connectionString: databaseUrl.toString(),
    ssl: {
      ca: fs.readFileSync(path.join(process.cwd(), "global-bundle.pem")).toString(),
      rejectUnauthorized: true,
      checkServerIdentity: () => undefined,
    },
  },
});
