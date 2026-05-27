"use client";

import { useState } from "react";
import { BellRing, CalendarDays, RefreshCcw, UserCheck } from "lucide-react";
import { automationRules, sessions } from "@/lib/mock-data";
import { Panel } from "../_components/panel";
import { SearchInput } from "../_components/search-input";
import { FilterBar } from "../_components/filter-bar";
import { SessionRow } from "../_components/session-row";
import { EmptyState } from "../_components/empty-state";
import { StatCard } from "../_components/stat-card";

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
    (s) => s.confirmationStatus === "confirmed",
  ).length;
  const rescheduled = sessions.filter(
    (s) => s.confirmationStatus === "rescheduled",
  ).length;
  const present = sessions.filter((s) => s.attendanceStatus === "present").length;

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6">
        <p className="label">Agenda</p>
        <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-[var(--ink)]">
          Sessões e confirmações
        </h2>
        <p className="mt-1 text-[13px] text-[var(--ink-4)]">
          Acompanhe lembretes automáticos, reagendamentos e presença.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          icon={BellRing}
          label="Lembretes ativos"
          value={automationRules.length.toString()}
          detail="24h antes e reforço no dia"
        />
        <StatCard
          icon={RefreshCcw}
          label="Reagendamentos"
          value={rescheduled.toString()}
          detail="Sem troca manual"
        />
        <StatCard
          icon={UserCheck}
          label="Presença"
          value={`${present}/${confirmed}`}
          detail="Confirmações registradas"
        />
      </section>

      <div className="mt-6">
        <Panel
          eyebrow="Agenda"
          icon={CalendarDays}
          title="Próximas sessões"
          action={{ label: "Nova sessão" }}
          padded={false}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-3">
            <div className="min-w-[260px] flex-1">
              <SearchInput
                placeholder="Buscar por paciente..."
                value={search}
                onChange={setSearch}
              />
            </div>
            <FilterBar
              options={PERIODS}
              selected={period}
              onChange={setPeriod}
            />
          </div>

          {filtered.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={CalendarDays}
                title="Nenhuma sessão encontrada"
                description="Tente ajustar os filtros ou criar uma nova sessão."
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[78px_1.3fr_0.85fr_0.8fr_0.85fr] border-b border-[var(--border)] bg-[var(--surface-2)] px-5 py-2.5 max-lg:hidden">
                <span className="label-strong">Hora</span>
                <span className="label-strong">Paciente</span>
                <span className="label-strong">Confirmação</span>
                <span className="label-strong">Presença</span>
                <span className="label-strong">Financeiro</span>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {filtered.map((session) => (
                  <SessionRow key={session.id} session={session} />
                ))}
              </div>
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}
