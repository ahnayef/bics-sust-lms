import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  try {
    console.log("Dropping books table and its dependencies (copies, transactions, etc)...");
    // CASCADE will also drop foreign key constraints and dependent tables
    // that rely on books (like copies, transactions, pdf_submissions).
    await sql`DROP TABLE IF EXISTS books CASCADE;`;
    
    // We also should drop the dependent tables explicitly just in case Drizzle tries
    // to alter them instead of recreating them, which can cause conflicts.
    await sql`DROP TABLE IF EXISTS copies CASCADE;`;
    await sql`DROP TABLE IF EXISTS transactions CASCADE;`;
    await sql`DROP TABLE IF EXISTS pdf_submissions CASCADE;`;

    console.log("✅ Successfully dropped tables.");
    console.log("You can now safely run: bunx drizzle-kit push");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await sql.end();
  }
}

main();
