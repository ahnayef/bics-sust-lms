import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as queries from "./queries";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  const msg =
    "MISSING DATABASE_URL: Please add it to your .env.local file. You can find the URI in Supabase Dashboard -> Project Settings -> Database.";
  console.error(msg);
  if (process.env.NODE_ENV === "production") {
    // In production, we should probably fail fast if DB is required
    // throw new Error(msg);
  }
}

// Global caching for Next.js development hot-reloading
const globalForPostgres = globalThis as unknown as {
  postgresClient: postgres.Sql | undefined;
};

// Use fewer connections in Vercel/Serverless to avoid exhausting PgBouncer/Supabase pools
// VERCEL env var is true when deployed on Vercel
const isServerless = !!process.env.VERCEL;
const maxConnections = isServerless ? 2 : 10;

const client =
  globalForPostgres.postgresClient ??
  postgres(connectionString || "postgres://localhost:5432/postgres", {
    prepare: false, // Required for PgBouncer transaction mode
    ssl: connectionString?.includes("supabase") ? "require" : false,
    connect_timeout: 30, // Increased timeout to handle slow connections
    idle_timeout: 20, // Close idle connections faster to free up pool
    max_lifetime: 60 * 15, // 15 minutes max lifetime
    max: maxConnections, // Dynamically set based on environment
    onnotice: () => {}, // Supabase sends a lot of notices, ignore them
    fetch_types: false, // Disable type fetching for faster connection
    connection: {
      application_name: "bics-sust-lms",
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPostgres.postgresClient = client;
}

export const db = drizzle(client, { schema });
export { queries };
