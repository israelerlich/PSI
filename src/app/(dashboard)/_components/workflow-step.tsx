import type { LucideIcon } from "lucide-react";

export function WorkflowStep({
  detail,
  icon: Icon,
  title,
}: {
  detail: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-md bg-teal-50 text-[var(--brand)]">
        <Icon aria-hidden="true" size={17} strokeWidth={2} />
      </div>
      <div>
        <p className="font-semibold text-stone-950">{title}</p>
        <p className="mt-1 text-sm leading-6 text-stone-600">{detail}</p>
      </div>
    </div>
  );
}
