/**
 * Normalize a multi-schema `drizzle-kit pull` into the shape the app needs.
 *
 * `drizzle-kit pull` (with schemaFilter = ["public", <ref tenant>]) emits:
 *   - public tables as plain `pgTable(...)`        (public is the default schema)
 *   - tenant tables as `<refVar>.table(...)`       (wrapped in a pgSchema instance)
 *
 * The SAME tenant table defs must work for EVERY company via a per-request
 * `search_path`, so a hard-coded `pgSchema("crossml")` is wrong. This codemod
 * (run by `npm run db:normalize`, part of `npm run db:sync`) makes BOTH the
 * shared and the tenant tables plain, unqualified `pgTable(...)`:
 *   - tenant tables resolve to the active company schema (they exist there);
 *   - shared tables resolve to `public` (they exist only there).
 * The runtime `search_path = "<tenant>", public` routes each correctly, and
 * there are no table-name collisions between the two sets, so no qualification
 * is needed. (We deliberately do NOT pin shared tables to `pgSchema("public")` —
 * drizzle-orm rejects a schema literally named "public" at module load.)
 *
 * It also undoes two artifacts of introspecting a NON-default schema:
 *   - drizzle-kit suffixes every tenant identifier with `In<Ref>` (e.g.
 *     `storeInCrossml`) — stripped so the app's stable import names resolve;
 *   - it schema-qualifies / mis-quotes identity-sequence names — flattened (they
 *     only matter for migration GENERATION, which never runs here: pull-only).
 *
 * It never invents schema — it only re-points what drizzle-kit introspected.
 */
import fs from "node:fs";
import path from "node:path";

const OUT_DIR = process.env.DRIZZLE_OUT ?? "./src/lib/drizzle";
// Set by the db:sync / db:check orchestrators (auto-resolved, never hard-coded).
const REF = process.env.DRIZZLE_REF_SCHEMA;
if (!REF) {
  throw new Error(
    "DRIZZLE_REF_SCHEMA is not set. Run `npm run db:sync` (it auto-resolves an " +
      "existing tenant schema and passes it through).",
  );
}

function pascalCase(s: string): string {
  return s
    .split(/[_-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

/** drizzle-kit's disambiguation suffix for a non-public schema, e.g. "InCrossml". */
const REF_SUFFIX = "In" + pascalCase(REF);

/** Remove a named import from the `drizzle-orm/pg-core` import (any position). */
function dropNamedImport(src: string, name: string): string {
  return src
    .replace(new RegExp(`,\\s*${name}\\b`), "")
    .replace(new RegExp(`\\b${name}\\s*,\\s*`), "");
}

function normalizeSchema(src: string): string {
  // The pgSchema instance drizzle-kit created for the reference tenant schema:
  //   export const <var> = pgSchema("<REF>");
  const schemaDeclRe = new RegExp(
    `export const (\\w+) = pgSchema\\(\\s*["']${REF}["']\\s*\\);`,
  );
  const match = src.match(schemaDeclRe);
  if (!match) {
    throw new Error(
      `normalize-drizzle: no pgSchema("${REF}") declaration found.\n` +
        `Expected drizzle-kit pull to run with "${REF}" in schemaFilter ` +
        `(set DRIZZLE_REF_SCHEMA). Nothing was changed.`,
    );
  }
  const refVar = match[1];

  // 0. Drop standalone sequence declarations. drizzle-kit emits one per DB
  //    sequence, but tables carry their own inline identity config and nothing
  //    imports these; the tenant ones also reference the pgSchema var we remove.
  let out = src.replace(
    /^export const \w+ = (?:pgSequence|\w+\.sequence)\([^\n]*\n/gm,
    "",
  );

  // 1. Tenant tables: `<refVar>.table(` → plain, unqualified `pgTable(`.
  out = out.replace(new RegExp(`\\b${refVar}\\.table\\(`, "g"), "pgTable(");
  // 2. Remove the reference-tenant pgSchema instance entirely (shared tables stay
  //    plain pgTable; see file header for why we don't pin them to "public").
  out = out.replace(
    new RegExp(`export const ${refVar} = pgSchema\\([^)]*\\);\\n?`),
    "",
  );
  // 3. Strip the `In<Ref>` disambiguation suffix from tenant identifiers.
  out = stripRefSuffix(out);
  // 4. Repair identity-sequence `name:` values that drizzle-kit emits malformed
  //    for quoted / non-default-schema identifiers. These names only matter for
  //    migration GENERATION (never run here — pull-only), so any clean literal
  //    is fine. Three observed forms: schema-qualified+quoted ("crossml."x"") ,
  //    schema-qualified bare ("crossml.x"), and double-quoted (""x"") — the last
  //    is what drizzle-kit currently emits for the `_scrapeLinkslinks` table.
  out = out.replace(new RegExp(`"${REF}\\."(\\w+)""`, "g"), '"$1"');
  out = out.replace(new RegExp(`"${REF}\\.(\\w+)"`, "g"), '"$1"');
  out = out.replace(/""(\w+)""/g, '"$1"');
  // 5. Drop now-unused imports (everything is plain pgTable now).
  out = dropNamedImport(out, "pgSequence");
  out = dropNamedImport(out, "pgSchema");
  return out;
}

/** Strip drizzle-kit's `In<Ref>` suffix from every identifier occurrence. */
function stripRefSuffix(src: string): string {
  return src.replace(new RegExp(REF_SUFFIX, "g"), "");
}

function processFile(file: string, fn: (src: string) => string) {
  // path.resolve handles both a relative OUT_DIR (db:sync) and an absolute one
  // (db:check passes a temp dir); path.join(cwd, absDir) would mis-nest it.
  const abs = path.resolve(OUT_DIR, file);
  const src = fs.readFileSync(abs, "utf8");
  fs.writeFileSync(abs, fn(src));
  return path.relative(process.cwd(), abs);
}

function main() {
  const schema = processFile("schema.ts", normalizeSchema);
  // relations.ts references the same export names, so it carries the same
  // `In<Ref>` suffix — strip it there too so the imports line up.
  const relations = processFile("relations.ts", stripRefSuffix);
  console.log(
    `normalize-drizzle: unqualified "${REF}" tenant tables and stripped ` +
      `"${REF_SUFFIX}" in ${schema} + ${relations}.`,
  );
}

main();
