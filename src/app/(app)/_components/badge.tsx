import clsx from "clsx";

type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "info" | "brand";

const variantStyles: Record<BadgeVariant, string> = {
  neutral:
    "bg-[var(--surface-3)] text-[var(--ink-3)] border-[var(--border)]",
  success:
    "bg-[var(--success-soft)] text-[var(--success-text)] border-[#bfe3cf]",
  warning:
    "bg-[var(--warning-soft)] text-[var(--warning-text)] border-[#f3d8a3]",
  danger:
    "bg-[var(--danger-soft)] text-[var(--danger-text)] border-[#f3bcbc]",
  info:
    "bg-[var(--blue-soft)] text-[var(--blue-text)] border-[#cddfff]",
  brand:
    "bg-[var(--blue-soft)] text-[var(--blue-text)] border-[#cddfff]",
};

const dotColor: Record<BadgeVariant, string> = {
  neutral: "bg-[var(--ink-5)]",
  success: "bg-[var(--success)]",
  warning: "bg-[var(--warning)]",
  danger: "bg-[var(--danger)]",
  info: "bg-[var(--blue)]",
  brand: "bg-[var(--blue)]",
};

export function Badge({
  children,
  className,
  variant = "neutral",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: BadgeVariant;
}) {
  return (
    <span
      className={clsx(
        "inline-flex h-[22px] items-center gap-1.5 rounded-full border px-2 text-[11.5px] font-medium leading-none",
        variantStyles[variant],
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={clsx("inline-block size-1.5 rounded-full", dotColor[variant])}
      />
      {children}
    </span>
  );
}
