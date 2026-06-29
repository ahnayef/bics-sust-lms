import { createClient } from "@supabase/supabase-js";
const supabase = createClient("https://xyz.supabase.co", "xyz");
console.log(Object.keys(supabase.auth));
