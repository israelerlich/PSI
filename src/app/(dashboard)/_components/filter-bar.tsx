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
      role="group"
      aria-label="Filtros"
      className="inline-flex h-9 items-center gap-0 rounded-md border border-[var(--border)] bg-[var(--surface)] p-0.5"
    >
      {options.map((option) => {
        const isActive = option === selected;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={clsx(
              "h-8 rounded-[5px] px-3 text-[12.5px] font-medium transition-colors",
              isActive
                ? "bg-[var(--blue)] text-white shadow-sm"
                : "text-[var(--ink-3)] hover:bg-[var(--surface-3)] hover:text-[var(--ink)]",
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
