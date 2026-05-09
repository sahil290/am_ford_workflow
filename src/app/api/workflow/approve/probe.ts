import { createClient } from '@supabase/supabase-js';

async function probe() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('--- PROBING RECON_JOBS ---');
  const { data, error } = await supabaseAdmin
    .from('recon_jobs')
    .select('id, vehicle_label, vin, current_stage_code')
    .limit(10);

  if (error) {
    console.error('PROBE ERROR:', error);
    return;
  }

  console.log('LATEST JOBS:', JSON.stringify(data, null, 2));

  const targetId = 'a9ce8e16-e1e8-48a8-8cd8-ba5317789975';
  const match = data?.find(j => j.id === targetId);
  console.log('SEARCHING FOR TARGET ID:', targetId);
  console.log('MATCH FOUND:', match ? 'YES' : 'NO');
}

probe();
