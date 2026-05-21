"use client";

import { Bell, Menu, PhoneCall, Search } from "lucide-react";
import { notifications } from "@/lib/mock-data";

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--background)]/94 px-4 py-3 backdrop-blur md:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            aria-label="Abrir menu"
            className="tactile inline-flex size-10 items-center justify-center rounded-md bg-white text-stone-600 shadow-[var(--shadow-border)] hover:bg-[var(--surface-muted)] hover:shadow-[var(--shadow-border-hover)] lg:hidden"
            onClick={onMenuClick}
            type="button"
          >
            <Menu aria-hidden="true" size={20} strokeWidth={2} />
          </button>
          <div>
            <p className="text-sm font-medium text-[var(--brand)]">
              Hoje, 16/05/2026
            </p>
            <h1 className="text-balance text-xl font-semibold text-stone-950 md:text-2xl">
              Clínica em operação
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="tactile hidden h-10 items-center gap-2 rounded-md bg-white pl-3.5 pr-4 text-sm font-semibold text-stone-600 shadow-[var(--shadow-border)] hover:bg-[var(--surface-muted)] hover:shadow-[var(--shadow-border-hover)] sm:inline-flex"
            type="button"
          >
            <Search aria-hidden="true" size={17} strokeWidth={2} />
            Buscar paciente
          </button>
          <button
            className="tactile hidden h-10 items-center gap-2 rounded-md bg-white pl-3.5 pr-4 text-sm font-semibold text-stone-600 shadow-[var(--shadow-border)] hover:bg-[var(--surface-muted)] hover:shadow-[var(--shadow-border-hover)] sm:inline-flex"
            type="button"
          >
            <PhoneCall aria-hidden="true" size={17} strokeWidth={2} />
            WhatsApp
          </button>
          <button
            className="tactile inline-flex h-10 items-center gap-2 rounded-md bg-[var(--brand)] pl-3.5 pr-4 text-sm font-semibold text-white shadow-[var(--shadow-border)] hover:bg-[var(--brand-strong)]"
            type="button"
          >
            <Bell aria-hidden="true" size={17} strokeWidth={2} />
            <span className="hidden sm:inline">
              <span className="metric-number">{notifications.length}</span>{" "}
              notificações
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
