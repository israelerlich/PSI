import type { LucideIcon } from "lucide-react";

export function WorkflowStep({
  detail,
  icon: Icon,
  title,
  step,
}: {
  detail: string;
  icon: LucideIcon;
  title: string;
  step?: number;
}) {
  return (
    <div className="flex gap-3 border-b border-[var(--border)] py-3.5 first:pt-0 last:border-b-0 last:pb-0">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[var(--blue-soft)] text-[var(--blue)]">
        {step !== undefined ? (
          <span className="metric-number text-[13px] font-semibold">
            {step.toString().padStart(2, "0")}
          </span>
        ) : (
          <Icon aria-hidden="true" size={16} strokeWidth={1.8} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="h-card flex items-center gap-2 text-[14px]">
          {step !== undefined ? (
            <Icon
              aria-hidden="true"
              size={14}
              strokeWidth={1.8}
              className="text-[var(--ink-4)]"
            />
          ) : null}
          {title}
        </p>
        <p className="mt-1 text-[13px] leading-snug text-[var(--ink-3)]">
          {detail}
        </p>
      </div>
    </div>
  );
}
