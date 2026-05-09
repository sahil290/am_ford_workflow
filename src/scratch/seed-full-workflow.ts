import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bwihzzydumkypwftzizs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3aWh6enlkdW1reXB3ZnR6aXpzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEzMjM4OSwiZXhwIjoyMDkzNzA4Mzg5fQ.lA5Yjb6_npRiCiB68WUyyYW8WNzCsiGAsjl79oeRXA0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Synchronizing final workflow stages...');

  let { data: tenant } = await supabase.from('tenants').select('*').eq('code', 'REYNOLDS').single();
  let { data: workflow } = await supabase.from('workflow_templates').select('*').eq('code', 'STANDARD-RECON').single();

  if (!tenant || !workflow) {
    console.error('Setup data missing, please run initial seed first.');
    return;
  }

  // Clear existing stages to avoid sequence conflicts and remove unwanted stages
  await supabase.from('workflow_stage_definitions').delete().eq('workflow_template_id', workflow.id);

  const stages = [
    { name: 'Pre-Recon', dept: 'inventory', q: 'intake-q' },
    { name: 'RO Open', dept: 'service', q: 'service-q' },
    { name: 'Inspection & Estimating', dept: 'service', q: 'service-q' },
    { name: 'Mechanical Inspection', dept: 'recon', q: 'recon-q' },
    { name: 'Parts Estimate', dept: 'parts', q: 'parts-q' },
    { name: 'Advisor Review Estimate', dept: 'service', q: 'service-q' },
    { name: 'Needs Approval', dept: 'service', q: 'approval-q' },
    { name: 'Approved Work In Process', dept: 'recon', q: 'recon-q' },
    { name: 'Parts Fulfillment', dept: 'parts', q: 'parts-q' },
    { name: 'Offsite for Warranty/Recall', dept: 'external', q: 'external-q' },
    { name: 'Mechanical Repairs', dept: 'recon', q: 'recon-q' },
    { name: 'Close RO', dept: 'service', q: 'service-q' },
    { name: 'Body Shop', dept: 'recon', q: 'body-q' },
    { name: 'Detail', dept: 'detail', q: 'detail-q' },
    { name: 'Quality Check / QC', dept: 'recon', q: 'qc-q' },
    { name: 'Final Wash / Cleanup', dept: 'detail', q: 'detail-q' }
  ];

  for (let i = 0; i < stages.length; i++) {
    const s = stages[i];
    const code = s.name.toLowerCase().replace(/ & /g, '-').replace(/ \/ /g, '-').replace(/ /g, '-');
    
    const { error } = await supabase
      .from('workflow_stage_definitions')
      .upsert({
        tenant_id: tenant.id,
        workflow_template_id: workflow.id,
        stage_code: code,
        display_name: s.name,
        sequence_no: (i + 1) * 10,
        department_code: s.dept,
        queue_code: s.q
      }, { onConflict: 'workflow_template_id,stage_code' });

    if (error) console.error(`Error seeding ${s.name}:`, error);
  }

  console.log('Workflow synced! Inventory/Sales extras removed.');
}

seed();
