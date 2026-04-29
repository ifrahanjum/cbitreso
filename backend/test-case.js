const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const query = 'cse';
  console.log('Testing search for:', query);
  
  const { data: depts, error: err1 } = await supabase
    .from('departments')
    .select('code, name')
    .or(`code.ilike.%${query}%,name.ilike.%${query}%`)
    .limit(3);
    
  console.log('Depts:', depts);

  const { data: subs, error: err2 } = await supabase
    .from('subjects')
    .select('id, name, code, semester, department:departments(code)')
    .or(`name.ilike.%${query}%,code.ilike.%${query}%`)
    .limit(5);

  console.log('Subs:', subs);
}

test();
