import type { LucideIcon } from "lucide-react";

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
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[var(--line)] bg-white px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-[var(--surface-muted)] text-stone-400">
        <Icon aria-hidden="true" size={24} strokeWidth={1.5} />
      </div>
      <h3 className="mt-4 text-base font-semibold text-stone-700">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-stone-500">{description}</p>
      {action ? (
        <a
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-md border border-[var(--brand)] bg-[var(--brand)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
          href={action.href ?? "#"}
        >
          {action.label}
        </a>
      ) : null}
    </div>
  );
}
