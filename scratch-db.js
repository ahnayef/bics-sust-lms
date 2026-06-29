const postgres = require("postgres");
require("dotenv").config({ path: ".env.local" });

const sql = postgres(process.env.DATABASE_URL);

async function run() {
  try {
    const triggers = await sql`
      SELECT trigger_name, event_object_table, action_statement
      FROM information_schema.triggers
      WHERE event_object_table IN ('users', 'profiles');
    `;
    console.log("Triggers:", triggers);
    
    // Check if profile_completed is false for everyone
    const profiles = await sql`SELECT count(*) as total, sum(case when profile_completed then 1 else 0 end) as completed FROM public.profiles`;
    console.log("Profile stats:", profiles);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
