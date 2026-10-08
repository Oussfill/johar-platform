import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://zsfwjjpmyuquberawywp.supabase.co', 'sb_publishable_WaNgmcTVD4Hxjmy8xGFv0A_hYuvGeBe');

async function run() {
  const { data: d3, error: e3 } = await supabase.from('sanctions_list').select('*');
  console.log('sanctions_list', d3, e3);

  const { data: d4, error: e4 } = await supabase.from('roles').select('*');
  console.log('roles', d4, e4);
}

run();
