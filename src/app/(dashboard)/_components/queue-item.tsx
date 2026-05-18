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
        "rounded-md border p-3",
        tone === "danger" && "border-rose-200 bg-rose-50",
        tone === "warning" && "border-amber-200 bg-amber-50",
        tone === "neutral" && "border-stone-200 bg-stone-50",
      )}
    >
      <div className="flex gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/75 text-stone-800">
          <Icon aria-hidden="true" size={17} />
        </div>
        <div>
          <p className="font-semibold text-stone-950">{title}</p>
          <p className="mt-1 text-sm leading-6 text-stone-700">{detail}</p>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.1em] text-stone-500">
            {meta}
          </p>
        </div>
      </div>
    </article>
  );
}
