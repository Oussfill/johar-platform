import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://zsfwjjpmyuquberawywp.supabase.co', 'sb_publishable_WaNgmcTVD4Hxjmy8xGFv0A_hYuvGeBe');

async function run() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  console.log('profiles', data, error);

  const { data: d2, error: e2 } = await supabase.from('aml_checks').select('*');
  console.log('aml_checks', d2, e2);
}

run();
