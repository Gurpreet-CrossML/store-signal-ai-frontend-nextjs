import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Introspected by drizzle-kit pull (Django owns the schema) — generated,
    // regenerated wholesale, and not worth linting.
    "src/lib/drizzle/**",
  ]),
  {
    // shadcn-generated files (kept byte-identical to the registry, which still
    // ships the setState-in-effect pattern this rule forbids).
    files: ["src/hooks/use-mobile.ts", "src/components/ui/carousel.tsx"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    // TanStack Table's useReactTable() is flagged by the React Compiler as
    // unmemoizable; that's inherent to the library, not fixable at call sites.
    files: ["src/components/**/*data-table*.tsx"],
    rules: {
      "react-hooks/incompatible-library": "off",
    },
  },
]);

export default eslintConfig;
