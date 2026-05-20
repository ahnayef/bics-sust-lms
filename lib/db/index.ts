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

// Disable prefetch as it is not supported for "Transaction" mode in Supabase/PgBouncer
// If using Session mode or direct connection, prefetch can be enabled.
const client = postgres(connectionString || "postgres://localhost:5432/postgres", {
  prepare: false,
  ssl: connectionString?.includes("supabase") ? "require" : false,
  // Add a connection timeout to avoid hanging
  connect_timeout: 10,
});
export const db = drizzle(client, { schema });
