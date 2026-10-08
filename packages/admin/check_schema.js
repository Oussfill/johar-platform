import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'fake-key';

async function check() {
  const url = `${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`;
  const res = await fetch(url);
  const json = await res.json();
  console.log(json.definitions?.suppliers?.properties || json.components?.schemas?.suppliers?.properties || 'no suppliers');
  console.log(json.definitions?.profiles?.properties || json.components?.schemas?.profiles?.properties || 'no profiles');
  console.log(json.definitions?.companies?.properties || json.components?.schemas?.companies?.properties || 'no companies');
}
check();
