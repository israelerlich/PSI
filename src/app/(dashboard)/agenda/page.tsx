"use client";

import { useState } from "react";
import { BellRing, CalendarDays, RefreshCcw, UserCheck } from "lucide-react";
import { automationRules, sessions } from "@/lib/mock-data";
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

  const confirmed = sessions.filter(
    (session) => session.confirmationStatus === "confirmed",
  ).length;
  const rescheduled = sessions.filter(
    (session) => session.confirmationStatus === "rescheduled",
  ).length;
  const present = sessions.filter(
    (session) => session.attendanceStatus === "present",
  ).length;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
      <Panel
        action={{ label: "Nova sessão" }}
        eyebrow="Agenda"
        icon={CalendarDays}
        title="Próximas sessões"
      >
        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          <AgendaMetric
            icon={BellRing}
            label="Lembretes"
            value={`${automationRules.length} ativos`}
            detail="24h antes e reforço no dia"
          />
          <AgendaMetric
            icon={RefreshCcw}
            label="Reagendamentos"
            value={rescheduled.toString()}
            detail="Sem troca manual"
          />
          <AgendaMetric
            icon={UserCheck}
            label="Presença"
            value={present.toString()}
            detail={`${confirmed} confirmações registradas`}
          />
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto]">
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
            <div className="grid grid-cols-[80px_1.2fr_0.9fr_0.85fr_0.95fr] bg-[var(--surface-muted)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-stone-600 max-lg:hidden">
              <span>Hora</span>
              <span>Paciente</span>
              <span>Confirmação</span>
              <span>Presença</span>
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

function AgendaMetric({
  detail,
  icon: Icon,
  label,
  value,
}: {
  detail: string;
  icon: React.ComponentType<{
    className?: string;
    size?: number;
    strokeWidth?: number;
  }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-[var(--line)] bg-[var(--surface-muted)] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-stone-500">{label}</p>
        <Icon aria-hidden="true" className="text-[var(--brand)]" size={18} />
      </div>
      <p className="mt-2 text-2xl font-semibold text-stone-950">{value}</p>
      <p className="mt-1 text-sm text-stone-500">{detail}</p>
    </div>
  );
}
