import { Search, X } from "lucide-react";

export function SearchInput({
  placeholder = "Buscar...",
  value,
  onChange,
}: {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="relative block min-w-0">
      <span className="sr-only">{placeholder}</span>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-4)]"
        size={16}
        strokeWidth={1.8}
      />
      <input
        className="input pl-10 pr-10"
        autoComplete="off"
        placeholder={placeholder}
        type="search"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      />
      {value ? (
        <button
          type="button"
          aria-label="Limpar busca"
          onClick={() => onChange?.("")}
          className="btn btn-ghost btn-sm absolute right-1 top-1/2 -translate-y-1/2 size-8 px-0"
        >
          <X size={14} strokeWidth={1.8} />
        </button>
      ) : null}
    </label>
  );
}
