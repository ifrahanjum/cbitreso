const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:/Users/ifrah/reso/backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkData() {
  const { data, error } = await supabase
    .from('resources')
    .select('id, title, uploaded_by, is_anonymous, status')
    .limit(10);

  if (error) {
    console.error('Error fetching data:', error);
    return;
  }

  console.log('--- DATA SNAPSHOT ---');
  console.table(data);
}

checkData();
