import clsx from "clsx";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "animate-pulse rounded-md bg-stone-200",
        className,
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="surface-card space-y-4 rounded-[10px] bg-white p-5">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}
