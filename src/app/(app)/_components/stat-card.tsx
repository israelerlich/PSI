import type { LucideIcon } from "lucide-react";

export function StatCard({
  detail,
  icon: Icon,
  label,
  value,
  trend,
}: {
  detail: string;
  icon: LucideIcon;
  label: string;
  value: string;
  trend?: { label: string; tone: "positive" | "negative" | "neutral" };
  index?: string;
}) {
  return (
    <article className="card card-hover p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="label-strong">{label}</p>
        <div className="flex size-8 items-center justify-center rounded-md bg-[var(--blue-soft)] text-[var(--blue)]">
          <Icon aria-hidden="true" size={16} strokeWidth={1.8} />
        </div>
      </div>
      <p className="metric-number mt-3 text-[28px] font-semibold leading-none text-[var(--ink)]">
        {value}
      </p>
      <div className="mt-3 flex items-center gap-2">
        {trend ? (
          <span
            className={
              trend.tone === "positive"
                ? "inline-flex items-center rounded-full bg-[var(--success-soft)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--success-text)]"
                : trend.tone === "negative"
                  ? "inline-flex items-center rounded-full bg-[var(--danger-soft)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--danger-text)]"
                  : "inline-flex items-center rounded-full bg-[var(--surface-3)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--ink-3)]"
            }
          >
            {trend.label}
          </span>
        ) : null}
        <p className="text-[12.5px] text-[var(--ink-4)]">{detail}</p>
      </div>
    </article>
  );
}
