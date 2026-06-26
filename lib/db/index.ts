import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  const msg = "MISSING DATABASE_URL: Please add it to your .env.local file. You can find the URI in Supabase Dashboard -> Project Settings -> Database.";
  console.error(msg);
  if (process.env.NODE_ENV === "production") {
    // In production, we should probably fail fast if DB is required
    // throw new Error(msg); 
  }
}

// Supabase/PgBouncer-friendly settings
const client = postgres(connectionString || "postgres://localhost:5432/postgres", {
  prepare: false, // Required for PgBouncer transaction mode
  ssl: connectionString?.includes("supabase") ? "require" : false,
  connect_timeout: 10,
  idle_timeout: 20,
  max_lifetime: 60 * 60, // 1 hour
  max: 10, // Limit max connections
  onnotice: () => {}, // Supabase sends a lot of notices, ignore them
});
export const db = drizzle(client, { schema });
