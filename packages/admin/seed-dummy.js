import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://zsfwjjpmyuquberawywp.supabase.co', 'sb_publishable_WaNgmcTVD4Hxjmy8xGFv0A_hYuvGeBe');

async function seed() {
  const { data: roles } = await supabase.from('roles').select('id');
  if (!roles || roles.length === 0) {
    console.log('Seeding roles...');
    await supabase.from('roles').insert([
      { role_name: 'مدير النظام', permissions: { users: { view: true, add: true, edit: true, delete: true }, finance: { view: true, add: true, edit: true, delete: true } } },
      { role_name: 'موظف مختبر', permissions: { lab: { view: true, add: true, edit: true, delete: false }, assets: { view: true, add: false, edit: false, delete: false } } },
      { role_name: 'مدقق امتثال', permissions: { kyc: { view: true, add: true, edit: true, delete: false }, contracts: { view: true, add: false, edit: false, delete: false } } }
    ]);
  }

  const { data: sanctions } = await supabase.from('sanctions_list').select('id');
  if (!sanctions || sanctions.length === 0) {
    console.log('Seeding sanctions...');
    await supabase.from('sanctions_list').insert([
      { entity_name: 'أحمد الإرهابي', country: 'SYRIA' },
      { entity_name: 'شركة غسيل الأموال المحدودة', country: 'RUSSIA' },
      { entity_name: 'JOHN DOE', country: 'IRAN' }
    ]);
  }
  console.log('Seed check complete.');
}

seed();
