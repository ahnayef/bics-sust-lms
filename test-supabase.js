const { createClient } = require("@supabase/supabase-js");
const supabase = createClient("https://example.supabase.co", "eyJhbGci...");
console.log(typeof supabase.auth.getClaims);
console.log(Object.keys(supabase.auth));
