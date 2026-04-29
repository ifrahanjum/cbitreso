require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  console.log('Disabling RLS on resources...');
  const { error } = await supabase.from('resources').update({ status: 'active' }).eq('id', '00000000-0000-0000-0000-000000000000'); // Dummy call to wake up
  
  const { data, error: err } = await supabase.from('resources').select('*').eq('status', 'deleted').limit(1);
  console.log('RLS Check (can see deleted?):', !!data && data.length > 0, err?.message || 'no error');
}

test();
