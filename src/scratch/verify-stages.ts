import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bwihzzydumkypwftzizs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3aWh6enlkdW1reXB3ZnR6aXpzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEzMjM4OSwiZXhwIjoyMDkzNzA4Mzg5fQ.lA5Yjb6_npRiCiB68WUyyYW8WNzCsiGAsjl79oeRXA0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: stages } = await supabase.from('workflow_stage_definitions').select('display_name, stage_code');
  console.log('Stages in DB:', stages?.map(s => s.display_name).join(', '));
}

check();
