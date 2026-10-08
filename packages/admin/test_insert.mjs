import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zsfwjjpmyuquberawywp.supabase.co'; // Based on project ref
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY; // I need to get this from .env

console.log("Reading env...");
import fs from 'fs';
const envFile = fs.readFileSync('.env', 'utf8');
const urlMatch = envFile.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const url = urlMatch ? urlMatch[1].trim() : SUPABASE_URL;
const key = keyMatch ? keyMatch[1].trim() : '';

if (!key) {
  console.log("No anon key found!");
  process.exit(1);
}

const supabase = createClient(url, key);

async function test() {
  console.log('Testing insert into companies...');
  
  const { data: insertData, error: insertError } = await supabase
    .from('companies')
    .insert([{
      name: 'Test Company ' + Date.now(),
      registration_number: '12345',
      industry: 'Tech',
      status: 'ACTIVE'
    }])
    .select();

  if (insertError) {
    console.error('Insert Failed:', insertError);
  } else {
    console.log('Insert Succeeded! Data:', insertData);
  }

  console.log('Fetching companies...');
  const { data: fetchList, error: fetchError } = await supabase
    .from('companies')
    .select('*')
    .limit(5);
    
  if (fetchError) {
    console.error('Fetch Failed:', fetchError);
  } else {
    console.log('Fetched:', fetchList);
  }
}

test();
