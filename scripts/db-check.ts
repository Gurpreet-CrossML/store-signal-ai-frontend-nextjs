/**
 * Deploy/CI drift guard: re-introspect the live DB into a throwaway dir, run the
 * same normalize step, and fail if the result differs from the committed
 * `src/lib/drizzle/schema.ts`. Run as `npm run db:check` before `next build` so a
 * stale schema can never ship. Django owns the DDL; this only proves the
 * committed Drizzle schema still matches reality. Read-only — never mutates.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { resolveRefSchema } from "./ref-schema";

const COMMITTED = path.join(process.cwd(), "src/lib/drizzle/schema.ts");

// Compare structurally, ignoring formatting/whitespace differences (the
// committed file is eslint-formatted; the freshly-pulled temp file is not).
function canonical(src: string): string {
  return src.replace(/\s+/g, " ").trim();
}

async function main() {
  // Auto-resolve an existing tenant schema (never hard-coded); pass it through.
  const ref = await resolveRefSchema();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "drizzle-check-"));
  try {
    const env = { ...process.env, DRIZZLE_OUT: tmp, DRIZZLE_REF_SCHEMA: ref };
    // 1. Re-introspect into the temp dir.
    execFileSync(process.execPath, ["node_modules/.bin/drizzle-kit", "pull"], {
      env,
      stdio: "inherit",
    });
    // 2. Normalize the temp schema with the same codemod.
    execFileSync(
      process.execPath,
      ["--import", "tsx", "scripts/normalize-drizzle.ts"],
      { env, stdio: "inherit" },
    );

    const fresh = fs.readFileSync(path.join(tmp, "schema.ts"), "utf8");
    const committed = fs.readFileSync(COMMITTED, "utf8");

    if (canonical(fresh) !== canonical(committed)) {
      console.error(
        "\n✗ db:check — committed src/lib/drizzle/schema.ts is out of date.\n" +
          "  The live DB schema differs from the committed Drizzle schema.\n" +
          "  Run `npm run db:sync`, review, and commit the diff.\n",
      );
      process.exit(1);
    }
    console.log("✓ db:check — schema.ts matches the live DB.");
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
