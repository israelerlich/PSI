import clsx from "clsx";

type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "info" | "brand";

const variantStyles: Record<BadgeVariant, string> = {
  neutral: "border-stone-200 bg-stone-100 text-stone-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-rose-200 bg-rose-50 text-rose-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
  brand: "border-teal-200 bg-teal-50 text-teal-800",
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
        "inline-flex w-fit items-center rounded-md border px-2.5 py-1 text-xs font-bold uppercase tracking-[0.08em]",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
