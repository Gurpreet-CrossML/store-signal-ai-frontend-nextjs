/**
 * `npm run db:sync` — regenerate src/lib/drizzle from the live DB.
 *
 * Resolves an existing tenant schema (auto-discovered, or DRIZZLE_REF_SCHEMA if
 * set), then runs: drizzle-kit pull → normalize codemod → eslint --fix →
 * prettier --write. The resolved schema is passed to each step via the
 * environment, so nothing hard-codes a tenant name. Django owns the DDL; this
 * is introspect-only.
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
  // Format the generated files so they pass `prettier --check` like the rest of
  // the codebase (they are committed, not ignored). Runs last so prettier has
  // the final say on style. Prettier isn't a pinned dependency here, so invoke
  // it via npx — same as CI's `npx prettier --check .`. Pass explicit file
  // paths: prettier 3.x does not format reliably when handed a bare directory.
  execFileSync(
    "npx",
    [
      "prettier",
      "--write",
      "src/lib/drizzle/schema.ts",
      "src/lib/drizzle/relations.ts",
    ],
    { env, stdio: "inherit" },
  );
}

main().catch((err) => {
  // Print the full error (pg connection failures are AggregateErrors whose
  // `.message` is empty — printing only the message hides the real cause).
  console.error("db:sync failed:");
  console.error(err);
  process.exit(1);
});
