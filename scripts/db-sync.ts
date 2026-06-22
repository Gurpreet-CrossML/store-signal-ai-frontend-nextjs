/**
 * `npm run db:sync` — regenerate src/lib/drizzle from the live DB.
 *
 * Resolves an existing tenant schema (auto-discovered, or DRIZZLE_REF_SCHEMA if
 * set), then runs: drizzle-kit pull → normalize codemod → eslint --fix. The
 * resolved schema is passed to each step via the environment, so nothing
 * hard-codes a tenant name. Django owns the DDL; this is introspect-only.
 */
import { execFileSync } from "node:child_process";

import { resolveRefSchema } from "./ref-schema";

async function main() {
  const ref = await resolveRefSchema();
  const env = { ...process.env, DRIZZLE_REF_SCHEMA: ref };
  const node = process.execPath;
  const run = (args: string[]) =>
    execFileSync(node, args, { env, stdio: "inherit" });

  run(["node_modules/.bin/drizzle-kit", "pull"]);
  run(["--import", "tsx", "scripts/normalize-drizzle.ts"]);
  run(["node_modules/.bin/eslint", "--fix", "src/lib/drizzle"]);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
