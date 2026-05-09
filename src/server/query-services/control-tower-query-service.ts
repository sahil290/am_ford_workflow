import { supabase } from "@/lib/supabase";
import { 
  ControlTowerSnapshot, 
  QueueStageGroup, 
  QueueStageRow 
} from "@/modules/control-tower/domain/control-tower.types";

export async function getControlTowerSnapshot(): Promise<ControlTowerSnapshot> {
  // 1-3. Fetch data in parallel
  const [dealershipRes, stagesRes, jobsRes] = await Promise.all([
    supabase.from('dealerships').select('name').limit(1).single(),
    supabase.from('workflow_stage_definitions').select('*').order('sequence_no', { ascending: true }),
    supabase.from('recon_jobs').select('id, current_stage_code, started_at, updated_at, priority_score, status, tenant_id, dealership_id').or('status.eq.active,status.eq.completed')
  ]);

  const dealership = dealershipRes.data;
  const stages = stagesRes.data;
  const jobs = jobsRes.data;

  // 4. Ensure "Completed" stage exists in the definitions
  const allStages = [...(stages || [])];
  if (!allStages.find(s => s.stage_code === 'completed')) {
    allStages.push({
      stage_code: 'completed',
      display_name: 'Completed',
      department_code: 'lot',
      sequence_no: 999,
      config: { target_hours: 0 }
    });
  }

  // Transform data
  const rows = (jobs || []).map(j => ({
    recon_job_id: j.id,
    tenant_id: j.tenant_id,
    dealership_id: j.dealership_id,
    current_stage_code: j.current_stage_code,
    stock_number: 'N/A',
    vin: 'N/A',
    vehicle_label: 'Vehicle',
    priority_score: j.priority_score,
    stage_age_minutes: Math.floor((new Date().getTime() - new Date(j.updated_at || j.started_at).getTime()) / 60000),
    total_age_minutes: Math.floor((new Date().getTime() - new Date(j.started_at).getTime()) / 60000),
    sla_status: 'healthy',
    blocker_count: 0,
    assigned_user_id: null,
    sort_rank: 0
  }));

  const stageGroups: QueueStageGroup[] = [];
  const departments = [...new Set(allStages.map((s: any) => s.department_code))] as string[];
  
  departments.forEach((dept: string) => {
    const deptStages = allStages.filter(s => s.department_code === dept);
    const groupRows: QueueStageRow[] = deptStages.map(stage => {
      const stageVehicles = rows.filter(r => r.current_stage_code === stage.stage_code);
      const totalHours = stageVehicles.reduce((acc, v) => acc + (v.stage_age_minutes / 60), 0);
      
      let displayLabel = stage.display_name;
      if (stage.stage_code === 'approval-sent') displayLabel = "Send Approval";
      if (stage.stage_code === 'finalize-approval') displayLabel = "Finalise Approval";

      return {
        code: stage.stage_code,
        label: displayLabel,
        vehicles: stageVehicles.length,
        avgHours: stageVehicles.length > 0 ? totalHours / stageVehicles.length : 0,
        maxHours: stageVehicles.length > 0 ? Math.max(...stageVehicles.map(v => v.stage_age_minutes / 60)) : 0,
        targetHours: (stage.planned_duration_minutes !== null && stage.planned_duration_minutes !== undefined) 
          ? stage.planned_duration_minutes / 60 
          : ((stage.config as any)?.target_hours || 24),
        planned_duration_minutes: stage.planned_duration_minutes,
        blockers: stageVehicles.reduce((acc, v) => acc + v.blocker_count, 0),
        assignedTeam: stage.department_code,
        utilization: 0,
        status: "healthy",
        trend: "flat"
      };
    });

    stageGroups.push({
      code: dept,
      label: dept.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      totalVehicles: groupRows.reduce((acc, r) => acc + r.vehicles, 0),
      avgCycleDays: 0,
      rows: groupRows
    });
  });

  return {
    dealershipName: dealership?.name || "REYNOLDS AUTO-GROUP",
    regionLabel: "Regional Dashboard",
    updatedAtLabel: new Date().toLocaleTimeString(),
    kpis: [
      { code: 'active', label: 'Active Vehicles', value: rows.length.toString(), delta: '', emphasis: 'primary' },
      { code: 'cycle', label: 'Avg Cycle Time', value: '5.4d', delta: '', emphasis: 'neutral' },
      { code: 'blocked', label: 'Blocked Units', value: rows.filter(r => r.blocker_count > 0).length.toString(), delta: '', emphasis: 'warning' },
      { code: 'ready', label: 'Completed', value: rows.filter(r => r.current_stage_code === 'completed').length.toString(), delta: '', emphasis: 'primary' }
    ],
    stageGroups,
    alerts: [],
    staffLoad: stageGroups.map(group => {
      let capacity = 20;
      if (group.code === 'workshop') capacity = 15;
      if (group.code === 'detail') capacity = 10;
      if (group.code === 'lot') capacity = 50;
      
      const utilization = (group.totalVehicles / capacity) * 100;
      let status: 'healthy' | 'watch' | 'critical' = 'healthy';
      if (utilization > 90) status = 'critical';
      else if (utilization > 70) status = 'watch';

      return {
        team: group.label,
        activeUnits: group.totalVehicles,
        capacity: capacity,
        status: status
      };
    })
  };
}

