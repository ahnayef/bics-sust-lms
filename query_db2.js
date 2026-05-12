require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
async function run() {
  const { data, error } = await supabase.from('thanas').select('*').limit(1);
  if (error) {
    console.error('Error fetching thanas:', error);
  } else {
    console.log('thanas data:', data);
  }
}
run();
