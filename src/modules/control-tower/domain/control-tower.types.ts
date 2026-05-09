export type SlaState = "healthy" | "watch" | "critical" | "blocked";

export type TrendState = "up" | "down" | "flat";

export type QueueStageRow = {
  code: string;
  label: string;
  vehicles: number;
  avgHours: number;
  maxHours: number;
  targetHours: number;
  blockers: number;
  assignedTeam: string;
  utilization: number;
  status: SlaState;
  trend: TrendState;
  planned_duration_minutes?: number;
};

export type QueueStageGroup = {
  code: string;
  label: string;
  totalVehicles: number;
  avgCycleDays: number;
  rows: QueueStageRow[];
};

export type KpiMetric = {
  code: string;
  label: string;
  value: string;
  delta: string;
  emphasis: "primary" | "neutral" | "warning";
};

export type OpsAlert = {
  code: string;
  title: string;
  detail: string;
  severity: "critical" | "watch" | "info";
};

export type StaffLoad = {
  team: string;
  activeUnits: number;
  capacity: number;
  status: SlaState;
};

export type ControlTowerSnapshot = {
  dealershipName: string;
  regionLabel: string;
  updatedAtLabel: string;
  kpis: KpiMetric[];
  stageGroups: QueueStageGroup[];
  alerts: OpsAlert[];
  staffLoad: StaffLoad[];
};
