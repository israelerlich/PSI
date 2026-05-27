import { ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";

export function Panel({
  action,
  children,
  eyebrow,
  icon: Icon,
  title,
  description,
  padded = true,
}: {
  action?: { label: string; href?: string };
  children: React.ReactNode;
  eyebrow?: string;
  icon?: LucideIcon;
  title: string;
  description?: string;
  padded?: boolean;
}) {
  return (
    <section className="card overflow-hidden">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          {Icon ? (
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[var(--blue-soft)] text-[var(--blue)]">
              <Icon aria-hidden="true" size={16} strokeWidth={1.8} />
            </div>
          ) : null}
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--ink-5)]">
                {eyebrow}
              </p>
            ) : null}
            <h2 className="h-section mt-0.5 leading-tight">{title}</h2>
            {description ? (
              <p className="mt-1 text-[12.5px] text-[var(--ink-4)]">{description}</p>
            ) : null}
          </div>
        </div>
        {action ? (
          <PanelAction action={action} />
        ) : null}
      </header>
      <div className={padded ? "p-5" : ""}>{children}</div>
    </section>
  );
}

function PanelAction({ action }: { action: { label: string; href?: string } }) {
  const content = (
    <span className="btn btn-ghost btn-sm">
      {action.label}
      <ChevronRight aria-hidden="true" size={14} strokeWidth={1.8} />
    </span>
  );
  return action.href ? <Link href={action.href}>{content}</Link> : content;
}
