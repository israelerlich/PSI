"use client";

import { Bell, Menu, PhoneCall, Search } from "lucide-react";
import { notifications } from "@/lib/mock-data";

export function Header({
  onMenuClick,
}: {
  onMenuClick: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--background)]/94 px-4 py-3 backdrop-blur md:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            className="inline-flex size-10 items-center justify-center rounded-md border border-[var(--line)] bg-white text-stone-600 transition hover:bg-[var(--surface-muted)] lg:hidden"
            onClick={onMenuClick}
            type="button"
            aria-label="Abrir menu"
          >
            <Menu size={20} strokeWidth={2} />
          </button>
          <div>
            <p className="text-sm font-medium text-[var(--brand)]">
              Hoje, 16/05/2026
            </p>
            <h1 className="text-xl font-semibold text-stone-950 md:text-2xl">
              Clínica em operação
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="hidden h-10 items-center gap-2 rounded-md border border-[var(--line)] bg-white px-3 text-sm font-semibold text-stone-600 transition hover:bg-[var(--surface-muted)] sm:inline-flex"
            type="button"
          >
            <Search aria-hidden="true" size={17} strokeWidth={2} />
            Buscar paciente
          </button>
          <button
            className="hidden h-10 items-center gap-2 rounded-md border border-[var(--line)] bg-white px-3 text-sm font-semibold text-stone-600 transition hover:bg-[var(--surface-muted)] sm:inline-flex"
            type="button"
          >
            <PhoneCall aria-hidden="true" size={17} strokeWidth={2} />
            WhatsApp
          </button>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--brand)] bg-[var(--brand)] px-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
            type="button"
          >
            <Bell aria-hidden="true" size={17} strokeWidth={2} />
            <span className="hidden sm:inline">
              {notifications.length} notificações
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
