import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function listTables() {
  const { data, error } = await supabase.rpc('get_tables');
  if (error) {
    // If RPC doesn't exist, try common workshop tables
    const tables = ['vehicles', 'recon_jobs', 'locations', 'vendors'];
    for (const t of tables) {
      const { error: te } = await supabase.from(t).select('*').limit(1);
      console.log(`Table ${t}:`, te ? te.message : 'Exists');
    }
  } else {
    console.log('Tables:', data);
  }
}

listTables();
