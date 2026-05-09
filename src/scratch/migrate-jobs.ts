import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bwihzzydumkypwftzizs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3aWh6enlkdW1reXB3ZnR6aXpzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEzMjM4OSwiZXhwIjoyMDkzNzA4Mzg5fQ.lA5Yjb6_npRiCiB68WUyyYW8WNzCsiGAsjl79oeRXA0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateJobs() {
  console.log('Migrating existing jobs to new stage codes...');

  // Fix jobs in old pre-recon stage
  const { error: e1 } = await supabase
    .from('recon_jobs')
    .update({ current_stage_code: 'pre-recon' })
    .eq('current_stage_code', 'pre-recon-vehicles');
  
  if (e1) console.error('Error migrating pre-recon:', e1);

  // Fix jobs in old service-advisors stage
  const { error: e2 } = await supabase
    .from('recon_jobs')
    .update({ current_stage_code: 'ro-open' })
    .eq('current_stage_code', 'service-advisors');

  if (e2) console.error('Error migrating service-advisors:', e2);

  console.log('Migration complete!');
}

migrateJobs();
