import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://zsfwjjpmyuquberawywp.supabase.co', 'sb_publishable_WaNgmcTVD4Hxjmy8xGFv0A_hYuvGeBe');

async function run() {
  const { data: d3, error: e3 } = await supabase.from('sanctions_list').select('*').limit(1);
  if (d3 && d3.length > 0) {
    console.log('sanctions_list cols', Object.keys(d3[0]));
  } else {
    console.log('sanctions_list', d3);
  }

  const { data: d4, error: e4 } = await supabase.from('roles').select('*').limit(1);
  if (d4 && d4.length > 0) {
    console.log('roles cols', Object.keys(d4[0]));
  } else {
    console.log('roles empty', d4);
  }
}

run();
