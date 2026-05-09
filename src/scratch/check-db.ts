import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bwihzzydumkypwftzizs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3aWh6enlkdW1reXB3ZnR6aXpzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEzMjM4OSwiZXhwIjoyMDkzNzA4Mzg5fQ.lA5Yjb6_npRiCiB68WUyyYW8WNzCsiGAsjl79oeRXA0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const { data: vehicles } = await supabase.from('vehicles').select('*');
  const { data: jobs } = await supabase.from('recon_jobs').select('*');
  const { data: stages } = await supabase.from('workflow_stage_definitions').select('*');

  console.log('Vehicles:', vehicles?.length);
  console.log('Jobs:', jobs?.length);
  console.log('Stages:', stages?.length);

  if (jobs && jobs.length > 0) {
    console.log('First Job Stage:', jobs[0].current_stage_code);
  }
}

checkData();
