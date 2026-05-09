import type { KpiMetric } from "@/modules/control-tower/domain/control-tower.types";

const emphasisClassMap: Record<KpiMetric["emphasis"], string> = {
  primary: "border-[rgba(80,156,255,0.38)] bg-[linear-gradient(180deg,rgba(60,140,255,0.22),rgba(19,34,55,0.95))]",
  neutral: "border-[var(--border-soft)] bg-[rgba(11,21,36,0.88)]",
  warning: "border-[rgba(245,180,84,0.28)] bg-[linear-gradient(180deg,rgba(245,180,84,0.16),rgba(24,20,14,0.92))]",
};

export function KpiStrip({ metrics }: { metrics: KpiMetric[] }) {
  return (
    <section className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
      {metrics.map((metric) => (
        <article
          key={metric.code}
          className={`rounded-[24px] border p-4 ${emphasisClassMap[metric.emphasis]}`}
        >
          <p className="text-[11px] uppercase tracking-[0.26em] text-[var(--text-secondary)]">
            {metric.label}
          </p>
          <div className="mt-4 flex items-end justify-between gap-3">
            <div className="font-display text-3xl font-semibold tracking-[-0.04em] text-white">
              {metric.value}
            </div>
            <div className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] text-[var(--text-secondary)]">
              {metric.delta}
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
