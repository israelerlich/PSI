import type { LucideIcon } from "lucide-react";

export function StatCard({
  detail,
  icon: Icon,
  label,
  value,
}: {
  detail: string;
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <article className="surface-card rounded-[10px] bg-white p-4 transition-[transform] duration-150 ease-out hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-stone-500">{label}</p>
          <p className="metric-number mt-2 text-3xl font-semibold text-stone-950">
            {value}
          </p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-md bg-[var(--surface-muted)] text-[var(--brand)]">
          <Icon aria-hidden="true" size={20} strokeWidth={1.9} />
        </div>
      </div>
      <p className="mt-3 text-pretty text-sm text-stone-500">{detail}</p>
    </article>
  );
}
