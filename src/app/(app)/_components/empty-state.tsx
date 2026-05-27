import type { LucideIcon } from "lucide-react";
import Link from "next/link";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href?: string };
}) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-[var(--blue-soft)] text-[var(--blue)]">
        <Icon aria-hidden="true" size={22} strokeWidth={1.6} />
      </div>
      <h3 className="mt-4 text-[15px] font-semibold text-[var(--ink)]">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-[var(--ink-4)]">
        {description}
      </p>
      {action ? (
        <Link href={action.href ?? "#"} className="btn btn-primary mt-5">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
