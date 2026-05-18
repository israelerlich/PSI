import { ChevronRight, type LucideIcon } from "lucide-react";

export function Panel({
  action,
  children,
  eyebrow,
  icon: Icon,
  title,
}: {
  action?: { label: string; href?: string };
  children: React.ReactNode;
  eyebrow: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[var(--surface-muted)] text-[var(--brand)]">
            <Icon aria-hidden="true" size={18} strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
              {eyebrow}
            </p>
            <h2 className="text-lg font-semibold text-stone-950">{title}</h2>
          </div>
        </div>
        {action ? (
          <a
            className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--line)] bg-white px-3 text-sm font-semibold text-stone-600 transition hover:bg-[var(--surface-muted)]"
            href={action.href ?? "#"}
          >
            <ChevronRight aria-hidden="true" size={16} strokeWidth={2} />
            {action.label}
          </a>
        ) : null}
      </div>
      {children}
    </section>
  );
}
