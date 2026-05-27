"use client";

import { Bell, Menu, Search } from "lucide-react";
import { notifications } from "@/lib/mock-data";

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const today = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(new Date("2026-05-16T12:00:00-03:00"));

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md">
      <div className="flex w-full items-center gap-3 px-4 md:px-8">
        <button
          type="button"
          aria-label="Abrir menu"
          onClick={onMenuClick}
          className="btn btn-ghost size-9 px-0 lg:hidden"
        >
          <Menu aria-hidden="true" size={18} strokeWidth={1.8} />
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-[11.5px] font-medium text-[var(--ink-4)]">
            {today.charAt(0).toUpperCase() + today.slice(1)}
          </p>
          <h1 className="h-page truncate">Visão geral</h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search
              aria-hidden="true"
              size={15}
              strokeWidth={1.8}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-4)]"
            />
            <input
              type="search"
              placeholder="Buscar paciente, sessão..."
              className="input pl-9 pr-3 w-64 h-9 text-[13px]"
              aria-label="Buscar"
            />
          </div>

          <button
            type="button"
            aria-label="Notificações"
            className="btn btn-secondary relative size-9 px-0"
          >
            <Bell aria-hidden="true" size={16} strokeWidth={1.8} />
            {notifications.length > 0 ? (
              <span
                aria-hidden="true"
                className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-[var(--blue)] text-[9.5px] font-semibold text-white"
              >
                {notifications.length}
              </span>
            ) : null}
          </button>

          <button type="button" className="btn btn-primary hidden sm:inline-flex">
            + Nova sessão
          </button>
        </div>
      </div>
    </header>
  );
}
