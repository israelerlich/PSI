import clsx from "clsx";
import type { LucideIcon } from "lucide-react";

export function QueueItem({
  detail,
  icon: Icon,
  meta,
  title,
  tone = "neutral",
}: {
  detail: string;
  icon: LucideIcon;
  meta: string;
  title: string;
  tone?: "danger" | "warning" | "neutral";
}) {
  const accent =
    tone === "danger"
      ? "bg-[var(--danger-soft)] text-[var(--danger)]"
      : tone === "warning"
        ? "bg-[var(--warning-soft)] text-[var(--warning)]"
        : "bg-[var(--blue-soft)] text-[var(--blue)]";

  const metaColor =
    tone === "danger"
      ? "text-[var(--danger-text)]"
      : tone === "warning"
        ? "text-[var(--warning-text)]"
        : "text-[var(--ink-4)]";

  return (
    <article className="flex items-start gap-3 border-b border-[var(--border)] px-5 py-4 last:border-b-0">
      <div className={clsx("flex size-9 shrink-0 items-center justify-center rounded-md", accent)}>
        <Icon aria-hidden="true" size={16} strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="h-card text-[14px] font-semibold text-[var(--ink)]">
            {title}
          </h3>
          <span className={clsx("shrink-0 text-[11px] font-medium", metaColor)}>
            {meta}
          </span>
        </div>
        <p className="mt-1 text-[13px] leading-snug text-[var(--ink-3)]">
          {detail}
        </p>
      </div>
    </article>
  );
}
