import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

async function main() {
  const { data: copies } = await supabase.from("copies").select("id").limit(5);
  console.log("Copies from DB:", copies);
}

main();
