import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./src/lib/drizzle",
  dialect: "postgresql",
  schema: "./src/lib/drizzle/schema.ts",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
