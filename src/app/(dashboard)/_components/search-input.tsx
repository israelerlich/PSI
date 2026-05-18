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
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
        size={18}
      />
      <input
        className="h-11 w-full min-w-0 rounded-md border border-[var(--line)] bg-white pl-10 pr-8 text-sm outline-none transition placeholder:text-stone-400 focus:border-[var(--brand)] focus:ring-2 focus:ring-teal-100"
        autoComplete="off"
        placeholder={placeholder}
        type="search"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      />
      {value ? (
        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-stone-400 hover:text-stone-600"
          onClick={() => onChange?.("")}
          type="button"
          aria-label="Limpar busca"
        >
          <X size={16} />
        </button>
      ) : null}
    </label>
  );
}
