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
  return (
    <article
      className={clsx(
        "rounded-md p-3 shadow-[var(--shadow-border)]",
        tone === "danger" && "bg-rose-50",
        tone === "warning" && "bg-amber-50",
        tone === "neutral" && "bg-stone-50",
      )}
    >
      <div className="flex gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/75 text-stone-800">
          <Icon aria-hidden="true" size={17} />
        </div>
        <div>
          <p className="font-semibold text-stone-950">{title}</p>
          <p className="mt-1 text-pretty text-sm leading-6 text-stone-700">
            {detail}
          </p>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.1em] text-stone-500">
            {meta}
          </p>
        </div>
      </div>
    </article>
  );
}
