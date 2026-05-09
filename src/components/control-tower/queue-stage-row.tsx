import { cn } from "@/lib/utils";
import type { QueueStageRow } from "@/modules/control-tower/domain/control-tower.types";

const statusAccentMap: Record<QueueStageRow["status"], string> = {
  healthy: "from-[rgba(77,210,168,0.18)] to-[rgba(77,210,168,0.03)] border-[rgba(77,210,168,0.22)]",
  watch: "from-[rgba(245,180,84,0.2)] to-[rgba(245,180,84,0.03)] border-[rgba(245,180,84,0.28)]",
  critical: "from-[rgba(255,109,109,0.22)] to-[rgba(255,109,109,0.03)] border-[rgba(255,109,109,0.28)]",
  blocked: "from-[rgba(255,145,77,0.26)] to-[rgba(255,145,77,0.06)] border-[rgba(255,145,77,0.34)]",
};

export function QueueStageRowCard({ row }: { row: QueueStageRow }) {
  return (
    <article
      className={cn(
        "grid gap-3 rounded-[20px] border bg-[linear-gradient(180deg,var(--bg-row),var(--bg-row-muted))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-transform duration-200 hover:-translate-y-[1px] hover:border-[var(--border-strong)] md:grid-cols-[minmax(0,2.6fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)] md:items-center",
        statusAccentMap[row.status],
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-medium text-white">{row.label}</h3>
          {row.blockers > 0 ? (
            <span className="rounded-full bg-[rgba(255,145,77,0.18)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--blocked)]">
              {row.blockers} blocker{row.blockers === 1 ? "" : "s"}
            </span>
          ) : null}
          {row.planned_duration_minutes && (
            <span className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.22em]",
              (row.maxHours * 60) > row.planned_duration_minutes 
                ? "bg-red-500/20 text-red-400 border border-red-500/30" 
                : "bg-green-500/20 text-green-400 border border-green-500/30"
            )}>
              {(row.maxHours * 60) > row.planned_duration_minutes ? "Delay" : "On Time"}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          {row.assignedTeam} - planned {(row.planned_duration_minutes || 0) / 60}h - max {row.maxHours.toFixed(1)}h
        </p>
      </div>

      <MetricPill label="Units" value={row.vehicles.toString()} emphasis="solid" />
      <MetricPill label="Avg Cycle" value={`${row.avgHours.toFixed(1)}h`} />

      <div className="grid gap-2">
        <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
          <span>Load</span>
          <span>{row.utilization}%</span>
        </div>
        <div className="h-2 rounded-full bg-black/25">
          <div
            className={cn(
              "h-2 rounded-full",
              row.status === "critical" && "bg-[var(--critical)]",
              row.status === "blocked" && "bg-[var(--blocked)]",
              row.status === "watch" && "bg-[var(--watch)]",
              row.status === "healthy" && "bg-[var(--healthy)]",
            )}
            style={{ width: `${Math.min(row.utilization, 100)}%` }}
          />
        </div>
      </div>
    </article>
  );
}

function MetricPill({
  label,
  value,
  emphasis = "soft",
}: {
  label: string;
  value: string;
  emphasis?: "soft" | "solid";
}) {
  return (
    <div
      className={cn(
        "rounded-[18px] border px-3 py-2",
        emphasis === "solid"
          ? "border-[rgba(60,140,255,0.28)] bg-[rgba(60,140,255,0.14)]"
          : "border-white/8 bg-black/20",
      )}
    >
      <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
        {label}
      </div>
      <div className="mt-1 font-display text-lg font-semibold text-white">{value}</div>
    </div>
  );
}
