const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:/Users/ifrah/reso/backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const USER_ID = 'cffc2dd8-f2af-4655-a70b-b13fc0addf38';

async function claimResources() {
  console.log(` Claiming anonymous resources for user: ${USER_ID}`);
  
  const { data, error } = await supabase
    .from('resources')
    .update({ uploaded_by: USER_ID })
    .is('uploaded_by', null);

  if (error) {
    console.error(' Error claiming resources:', error);
    return;
  }

  const { count, error: countErr } = await supabase
    .from('resources')
    .select('*', { count: 'exact', head: true })
    .eq('uploaded_by', USER_ID);

  console.log(` Success! You now own all previously anonymous resources.`);
  console.log(` Total resources owned by you: ${count}`);
  console.log(`\n PLEASE RESTART YOUR BACKEND SERVER (node index.js) to see the delete buttons.`);
}

claimResources();
