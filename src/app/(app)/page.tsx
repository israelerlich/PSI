import {
  CalendarClock,
  FileCheck2,
  UsersRound,
  WalletCards,
  FileText,
} from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { getTodayStats } from "@/server/queries/stats";
import { listSessionsOnDate } from "@/server/queries/session";
import { StatCard } from "./_components/stat-card";
import { Panel } from "./_components/panel";
import { formatTime } from "@/lib/format/date";
import { Badge } from "./_components/badge";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HojePage() {
  const user = await requireUser();
  const today = new Date();
  const [stats, todaySessions] = await Promise.all([
    getTodayStats(user.id, today),
    listSessionsOnDate(user.id, today),
  ]);

  const niceDate = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(today);

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6">
        <p className="label">
          Hoje · {niceDate.charAt(0).toUpperCase() + niceDate.slice(1)}
        </p>
        <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-[var(--ink)]">
          Olá, {user.name.split(" ")[0]}
        </h2>
        <p className="mt-1 text-[13px] text-[var(--ink-4)]">
          {stats.todaySessionsCount}{" "}
          {stats.todaySessionsCount === 1 ? "sessão hoje" : "sessões hoje"} ·{" "}
          {stats.pendingRecords} prontuários abertos · {stats.pendingPayments}{" "}
          cobranças pendentes
        </p>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={CalendarClock}
          label="Sessões hoje"
          value={String(stats.todaySessionsCount)}
          detail={`${stats.confirmedToday} confirmadas`}
        />
        <StatCard
          icon={UsersRound}
          label="Pacientes ativos"
          value={String(stats.activePatients)}
          detail="Em acompanhamento"
        />
        <StatCard
          icon={WalletCards}
          label="Cobranças pendentes"
          value={String(stats.pendingPayments)}
          detail="Aguardando pagamento"
        />
        <StatCard
          icon={FileCheck2}
          label="Presença"
          value={`${stats.attendanceRate}%`}
          detail="Atendimentos concluídos"
        />
      </section>

      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel
          eyebrow="Agenda do dia"
          title="Sessões de hoje"
          icon={CalendarClock}
          padded={false}
          action={{ label: "Ver agenda", href: "/agenda" }}
        >
          {todaySessions.length === 0 ? (
            <p className="px-5 py-8 text-center text-[13px] text-[var(--ink-4)]">
              Nenhuma sessão agendada para hoje.
            </p>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {todaySessions.map((s) => (
                <article
                  key={s.id}
                  className="row-hover grid grid-cols-[78px_1fr_auto] gap-3 px-5 py-4 items-center"
                >
                  <p className="metric-number text-[15px] font-semibold text-[var(--ink)]">
                    {formatTime(s.startsAt)}
                  </p>
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
                        variant={s.paymentStatus === "PAGO" ? "success" : "warning"}
                      >
                        {s.paymentStatus === "PAGO" ? "Pago" : "Pendente"}
                      </Badge>
                    </div>
                  </div>
                  <Link
                    href={`/agenda/${s.id}`}
                    className="btn btn-primary btn-sm"
                  >
                    Atender
                  </Link>
                </article>
              ))}
            </div>
          )}
        </Panel>

        <aside className="space-y-5">
          <Panel eyebrow="Pendências" title="A fazer" icon={FileText}>
            <ul className="space-y-2 text-[13.5px]">
              {stats.pendingRecords > 0 ? (
                <li className="flex items-center justify-between">
                  <span>Prontuários abertos</span>
                  <Link
                    href="/prontuarios"
                    className="text-[var(--blue)] hover:underline"
                  >
                    {stats.pendingRecords}
                  </Link>
                </li>
              ) : null}
              {stats.pendingPayments > 0 ? (
                <li className="flex items-center justify-between">
                  <span>Cobranças pendentes</span>
                  <Link
                    href="/financeiro"
                    className="text-[var(--blue)] hover:underline"
                  >
                    {stats.pendingPayments}
                  </Link>
                </li>
              ) : null}
              {stats.pendingRecords === 0 && stats.pendingPayments === 0 ? (
                <li className="text-[var(--ink-4)]">Tudo em dia.</li>
              ) : null}
            </ul>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
