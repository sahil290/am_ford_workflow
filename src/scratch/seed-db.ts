import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bwihzzydumkypwftzizs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3aWh6enlkdW1reXB3ZnR6aXpzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEzMjM4OSwiZXhwIjoyMDkzNzA4Mzg5fQ.lA5Yjb6_npRiCiB68WUyyYW8WNzCsiGAsjl79oeRXA0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Syncing database...');

  // 1. Get or Create Tenant
  let { data: tenant } = await supabase.from('tenants').select('*').eq('code', 'REYNOLDS').single();
  if (!tenant) {
    const { data: newTenant, error } = await supabase.from('tenants').insert({ name: 'REYNOLDS AUTO-GROUP', code: 'REYNOLDS' }).select().single();
    if (error) { console.error('Tenant error:', error); return; }
    tenant = newTenant;
  }
  console.log('Tenant ID:', tenant.id);

  // 2. Get or Create Dealership
  let { data: dealership } = await supabase.from('dealerships').select('*').eq('code', 'AM-FORD-01').single();
  if (!dealership) {
    const { data: newDealer, error } = await supabase.from('dealerships').insert({ tenant_id: tenant.id, name: 'AM FORD WORKSHOP', code: 'AM-FORD-01' }).select().single();
    if (error) { console.error('Dealership error:', error); return; }
    dealership = newDealer;
  }
  console.log('Dealership ID:', dealership.id);

  // 3. Get or Create Workflow Template
  let { data: workflow } = await supabase.from('workflow_templates').select('*').eq('code', 'STANDARD-RECON').single();
  if (!workflow) {
    const { data: newWF, error } = await supabase.from('workflow_templates').insert({ tenant_id: tenant.id, name: 'Standard Reconditioning', code: 'STANDARD-RECON' }).select().single();
    if (error) { console.error('Workflow error:', error); return; }
    workflow = newWF;
  }
  console.log('Workflow ID:', workflow.id);

  // 4. Create stages
  const stages = [
    { tenant_id: tenant.id, workflow_template_id: workflow.id, stage_code: 'pre-recon-vehicles', department_code: 'inventory', display_name: 'Pre-Recon Vehicles', sequence_no: 10, queue_code: 'intake-q' },
    { tenant_id: tenant.id, workflow_template_id: workflow.id, stage_code: 'ro-open', department_code: 'service', display_name: 'RO Open', sequence_no: 20, queue_code: 'service-q' },
    { tenant_id: tenant.id, workflow_template_id: workflow.id, stage_code: 'authorization-required', department_code: 'service', display_name: 'Authorization Required', sequence_no: 30, queue_code: 'approval-q' },
    { tenant_id: tenant.id, workflow_template_id: workflow.id, stage_code: 'recon-techs', department_code: 'recon', display_name: 'Recon Techs', sequence_no: 40, queue_code: 'recon-q' },
  ];

  for (const stage of stages) {
    const { error } = await supabase
      .from('workflow_stage_definitions')
      .upsert(stage, { onConflict: 'workflow_template_id,stage_code' });
    
    if (error) console.error(`Error syncing stage ${stage.stage_code}:`, error);
  }
  console.log('Stages synced.');

  console.log('Database sync complete!');
}

seed();
