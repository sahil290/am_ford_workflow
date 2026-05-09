import type { QueueStageGroup } from "@/modules/control-tower/domain/control-tower.types";
import { QueueStageRowCard } from "./queue-stage-row";

export function QueueStageGroupSection({ group }: { group: QueueStageGroup }) {
  return (
    <section className="ops-panel-strong rounded-[28px] p-4 md:p-5">
      <div className="flex flex-col gap-3 border-b border-white/6 pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--text-secondary)]">
            {group.label}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
            {group.totalVehicles} vehicles in flow
          </h2>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="rounded-full border border-white/8 bg-black/20 px-3 py-1.5 text-[var(--text-secondary)]">
            Avg cycle {group.avgCycleDays.toFixed(1)} days
          </div>
          <div className="rounded-full border border-[rgba(60,140,255,0.2)] bg-[rgba(60,140,255,0.12)] px-3 py-1.5 text-[var(--accent-strong)]">
            Live queue
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-3">
        {group.rows.map((row) => (
          <QueueStageRowCard key={row.code} row={row} />
        ))}
      </div>
    </section>
  );
}
