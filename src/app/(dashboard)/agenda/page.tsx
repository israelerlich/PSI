"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { sessions } from "@/lib/mock-data";
import { Panel } from "../_components/panel";
import { SearchInput } from "../_components/search-input";
import { FilterBar } from "../_components/filter-bar";
import { SessionRow } from "../_components/session-row";
import { EmptyState } from "../_components/empty-state";

const PERIODS = ["Hoje", "Semana", "Mês"] as const;

export default function AgendaPage() {
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<string>("Hoje");

  const filtered = sessions.filter((s) => {
    if (search && !s.patientName.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
      <Panel
        action={{ label: "Nova sessão" }}
        eyebrow="Agenda"
        icon={CalendarDays}
        title="Próximas sessões"
      >
        <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_auto]">
          <SearchInput
            placeholder="Buscar por paciente, status ou modalidade..."
            value={search}
            onChange={setSearch}
          />
          <FilterBar
            options={PERIODS}
            selected={period}
            onChange={setPeriod}
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Nenhuma sessão encontrada"
            description="Tente ajustar os filtros ou criar uma nova sessão."
          />
        ) : (
          <div className="overflow-hidden rounded-md border border-[var(--line)]">
            <div className="grid grid-cols-[80px_1.2fr_0.85fr_0.8fr_0.8fr] bg-[var(--surface-muted)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-stone-600 max-lg:hidden">
              <span>Hora</span>
              <span>Paciente</span>
              <span>Status</span>
              <span>Prontuário</span>
              <span>Financeiro</span>
            </div>
            <div className="divide-y divide-[var(--line)]">
              {filtered.map((session) => (
                <SessionRow key={session.id} session={session} />
              ))}
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
