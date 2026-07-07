import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local" });

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./supabase/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // Restrict introspection to the public schema only.
  // Without this, drizzle-kit tries to inspect storage.*, auth.* etc.
  // which causes: syntax error at or near "'storage.buckets'"
  schemaFilter: ["public"],
  // Store the drizzle migrations journal in public schema.
  // Without this, drizzle-kit looks for supabase_migrations.schema_migrations
  // which does not exist on Supabase, causing a relation-not-found error.
  migrations: {
    schema: "public",
  },
});
