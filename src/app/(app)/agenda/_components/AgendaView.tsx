"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Patient, TherapySession } from "@prisma/client";
import { FilterBar } from "../../_components/filter-bar";
import { EmptyState } from "../../_components/empty-state";
import { Panel } from "../../_components/panel";
import { Badge } from "../../_components/badge";
import { formatTime } from "@/lib/format/date";
import { CalendarDays } from "lucide-react";
import { SessionActions } from "./SessionActions";
import { NewSessionDrawer } from "./NewSessionDrawer";

const PERIODS = ["Hoje", "Semana", "Mês"] as const;
type SWP = TherapySession & { patient: Patient };

const attendanceLabel: Record<string, string> = {
  expected: "Prevista",
  present: "Presente",
  missed: "Falta",
  excused: "Justificada",
};

export function AgendaView({
  sessions,
  patients,
  initialPeriod,
  defaultPriceCents,
}: {
  sessions: SWP[];
  patients: Patient[];
  initialPeriod: string;
  defaultPriceCents: number;
}) {
  const router = useRouter();
  const [period, setPeriod] = useState(initialPeriod);
  const [drawerOpen, setDrawerOpen] = useState(false);

  function onPeriod(v: string) {
    setPeriod(v);
    const url = new URL(window.location.href);
    url.searchParams.set("p", v);
    router.replace(url.pathname + url.search);
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label">Agenda</p>
          <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-[var(--ink)]">
            Sessões e confirmações
          </h2>
        </div>
        <div className="flex gap-2 flex-wrap">
          <FilterBar options={PERIODS} selected={period} onChange={onPeriod} />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setDrawerOpen(true)}
          >
            + Nova sessão
          </button>
        </div>
      </div>

      <Panel
        eyebrow="Período"
        title={period}
        icon={CalendarDays}
        padded={false}
      >
        {sessions.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={CalendarDays}
              title="Sem sessões no período"
              description="Crie uma nova sessão para começar."
            />
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {sessions.map((s) => (
              <article
                key={s.id}
                className="row-hover grid grid-cols-1 gap-3 px-5 py-4 lg:grid-cols-[78px_1.3fr_auto] lg:items-center"
              >
                <div>
                  <p className="metric-number text-[15px] font-semibold text-[var(--ink)]">
                    {formatTime(s.startsAt)}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-[var(--ink-5)]">
                    {s.modality === "online" ? "Online" : "Presencial"}
                  </p>
                </div>
                <div className="min-w-0">
                  <Link
                    href={`/agenda/${s.id}`}
                    className="text-[14px] font-semibold text-[var(--ink)] hover:text-[var(--blue)]"
                  >
                    {s.patient.name}
                  </Link>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <Badge
                      variant={
                        s.confirmationStatus === "confirmed"
                          ? "success"
                          : "warning"
                      }
                    >
                      {s.confirmationStatus === "confirmed"
                        ? "Confirmada"
                        : "Aguardando"}
                    </Badge>
                    <Badge
                      variant={
                        s.attendanceStatus === "present"
                          ? "success"
                          : s.attendanceStatus === "missed"
                            ? "danger"
                            : "neutral"
                      }
                    >
                      {attendanceLabel[s.attendanceStatus] ?? s.attendanceStatus}
                    </Badge>
                    <Badge
                      variant={s.paymentStatus === "PAGO" ? "success" : "warning"}
                    >
                      {s.paymentStatus === "PAGO" ? "Pago" : "Pendente"}
                    </Badge>
                  </div>
                </div>
                <SessionActions
                  sessionId={s.id}
                  confirmed={s.confirmationStatus === "confirmed"}
                />
              </article>
            ))}
          </div>
        )}
      </Panel>

      <NewSessionDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        patients={patients}
        defaultPriceCents={defaultPriceCents}
      />
    </>
  );
}
