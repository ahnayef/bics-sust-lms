const { createClient } = require("@supabase/supabase-js");
const supabase = createClient("https://xyz.supabase.co", "xyz");
let obj = supabase.auth;
let methods = [];
do { 
  methods.push(...Object.getOwnPropertyNames(obj)); 
  obj = Object.getPrototypeOf(obj); 
} while (obj);
console.log(methods.filter(m => m.includes('Claim') || m.includes('Session') || m.includes('User')));
