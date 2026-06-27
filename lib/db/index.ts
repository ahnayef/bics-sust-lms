import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as queries from "./queries";
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
  connect_timeout: 30, // Increased timeout to handle slow connections
  idle_timeout: 20, // Close idle connections faster to free up pool
  max_lifetime: 60 * 15, // 15 minutes max lifetime (shorter to avoid stale connections)
  max: 10, // Lower max connections to avoid hitting Supabase limits (free tier has 60 total, but multiple instances add up)
  onnotice: () => { }, // Supabase sends a lot of notices, ignore them
  fetch_types: false, // Disable type fetching for faster connection
  connection: {
    application_name: "bics-sust-lms",
  },
});
export const db = drizzle(client, { schema });
export { queries };

