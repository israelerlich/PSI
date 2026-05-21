"use client";

import clsx from "clsx";

export function FilterBar<T extends string>({
  options,
  selected,
  onChange,
}: {
  options: readonly T[];
  selected: T;
  onChange: (value: T) => void;
}) {
  return (
    <div
      aria-label="Filtro de período"
      className="grid min-w-0 grid-cols-3 rounded-[12px] bg-white p-1 text-sm font-semibold shadow-[var(--shadow-border)]"
      role="group"
    >
      {options.map((option) => (
        <button
          className={clsx(
            "tactile h-10 min-w-0 rounded-md px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]",
            option === selected
              ? "bg-[var(--brand)] text-white"
              : "text-stone-600 hover:bg-[var(--surface-muted)]",
          )}
          key={option}
          type="button"
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
