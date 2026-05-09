import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkTable() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  console.log('Profiles check:', { hasData: !!data, error: error?.message });
  
  const { data: data2, error: error2 } = await supabase.from('employees').select('*').limit(1);
  console.log('Employees check:', { hasData: !!data2, error: error2?.message });

  const { data: data3, error: error3 } = await supabase.from('users').select('*').limit(1);
  console.log('Users check:', { hasData: !!data3, error: error3?.message });
}

checkTable();
