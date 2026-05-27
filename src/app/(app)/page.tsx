import {
  AlertTriangle,
  Bell,
  Bot,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  NotebookText,
  ReceiptText,
  TimerReset,
  UserRound,
  UsersRound,
  WalletCards,
} from "lucide-react";
import {
  agentSettings,
  automationRules,
  availableSlots,
  billingEntries,
  messageTemplates,
  notes,
  notifications,
  patients,
  records,
  sessions,
} from "@/lib/mock-data";
import { StatCard } from "./_components/stat-card";
import { Panel } from "./_components/panel";
import { QueueItem } from "./_components/queue-item";
import { SessionRow } from "./_components/session-row";
import { Badge } from "./_components/badge";
import { WorkflowStep } from "./_components/workflow-step";
import Link from "next/link";

const todayIso = "2026-05-16";

const activePatients = patients.filter((p) => !p.archived);
const todaySessions = sessions.filter((s) => s.startsAt.startsWith(todayIso));
const pendingPayments = sessions.filter(
  (s) => s.paymentStatus === "PENDENTE",
).length;
const readyInvoices = billingEntries.filter(
  (e) => e.invoiceStatus === "ready" || e.invoiceStatus === "queued",
).length;
const confirmedSessions = sessions.filter(
  (s) => s.confirmationStatus === "confirmed",
).length;
const concludedSessions = sessions.filter((s) => s.status === "CONCLUIDA").length;
const attendanceRate = Math.round(
  (sessions.filter((s) => s.attendanceStatus === "present").length /
    Math.max(1, concludedSessions)) *
    100,
);
const openRecords = sessions.filter(
  (s) => s.documentationStatus !== "complete",
).length;
const focusPatient =
  patients.find((p) => p.id === "pat_ana") ?? patients[0];
const focusPatientSessions = sessions.filter(
  (s) => s.patientId === focusPatient.id,
);
const focusPatientRecord = records.find(
  (r) => r.patientId === focusPatient.id,
);

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));

const formatTime = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));

const operationalQueue = [
  {
    icon: AlertTriangle,
    title: "Handoff pendente",
    detail: "Responder paciente que pediu contato direto pelo WhatsApp.",
    meta: "Alta prioridade",
    tone: "danger" as const,
  },
  {
    icon: NotebookText,
    title: "Prontuários a finalizar",
    detail: `${openRecords} sessões sem prontuário concluído.`,
    meta: "Hoje",
    tone: "warning" as const,
  },
  {
    icon: TimerReset,
    title: "Fila de espera",
    detail: "1 paciente pode receber o horário presencial liberado.",
    meta: `${agentSettings.waitlistAcceptanceHours}h para aceitar`,
    tone: "neutral" as const,
  },
  {
    icon: ReceiptText,
    title: "NFS-e e recibos",
    detail: `${readyInvoices} atendimentos prontos para nota fiscal ou recibo.`,
    meta: "Após pagamento",
    tone: "neutral" as const,
  },
];

export default function DashboardHome() {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-8" id="conteudo">
      {/* Page intro */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label">Boa tarde,</p>
          <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-[var(--ink)]">
            Resumo da clínica
          </h2>
          <p className="mt-1 text-[13px] text-[var(--ink-4)]">
            {todaySessions.length} sessões hoje · {activePatients.length} pacientes ativos · {openRecords} prontuários abertos
          </p>
        </div>
      </div>

      {/* KPIs */}
      <section
        aria-label="Indicadores principais"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          icon={CalendarClock}
          label="Sessões hoje"
          value={todaySessions.length.toString()}
          trend={{ label: `${confirmedSessions} confirmadas`, tone: "positive" }}
          detail="Agendamentos do dia"
        />
        <StatCard
          icon={UsersRound}
          label="Pacientes ativos"
          value={activePatients.length.toString()}
          detail="Em acompanhamento"
        />
        <StatCard
          icon={WalletCards}
          label="Recebíveis pendentes"
          value={pendingPayments.toString()}
          trend={{ label: "Pix em aberto", tone: "neutral" }}
          detail="Aguardando pagamento"
        />
        <StatCard
          icon={FileCheck2}
          label="Presença"
          value={`${attendanceRate}%`}
          trend={{
            label: attendanceRate >= 80 ? "Saudável" : "Atenção",
            tone: attendanceRate >= 80 ? "positive" : "negative",
          }}
          detail="Lembretes reduzem faltas"
        />
      </section>

      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          {/* Queue + Focus patient */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Panel
              eyebrow="Fila de trabalho"
              icon={ClipboardCheck}
              title="Prioridades administrativas"
              padded={false}
            >
              {operationalQueue.map((item) => (
                <QueueItem
                  key={item.title}
                  detail={item.detail}
                  icon={item.icon}
                  meta={item.meta}
                  title={item.title}
                  tone={item.tone}
                />
              ))}
            </Panel>

            <Panel
              eyebrow="Paciente em foco"
              icon={UserRound}
              title={focusPatient.name}
              description={`${focusPatient.modality} · ${focusPatient.whatsapp}`}
            >
              <dl className="grid grid-cols-2 gap-4">
                <Info label="Próxima sessão"
                  value={
                    focusPatient.nextSession
                      ? formatDateTime(focusPatient.nextSession)
                      : "Sem sessão"
                  }
                />
                <Info
                  label="Pendências"
                  value={`${focusPatient.documentsPending ?? 0} documentos`}
                />
                <Info
                  label="Sessões"
                  value={`${focusPatientSessions.length} registros`}
                />
                <Info
                  label="Prontuário"
                  value={focusPatientRecord ? "Iniciado" : "Sem prontuário"}
                />
              </dl>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {(focusPatient.alerts ?? []).map((alert) => (
                  <Badge key={alert} variant="neutral">
                    {alert}
                  </Badge>
                ))}
              </div>

              <div className="mt-4 rounded-md bg-[var(--surface-2)] p-3">
                <p className="label">Resumo clínico</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--ink-2)]">
                  {focusPatientSessions.length} sessões registradas,{" "}
                  {focusPatientRecord ? "prontuário iniciado" : "sem prontuário"}
                  ,{" "}
                  {notes.filter((n) => n.patientId === focusPatient.id).length}{" "}
                  anotação clínica.
                </p>
              </div>

              <div className="mt-4 flex justify-end">
                <Link
                  href={`/pacientes/${focusPatient.id}`}
                  className="btn btn-secondary btn-sm"
                >
                  Abrir ficha
                </Link>
              </div>
            </Panel>
          </div>

          {/* Próximas sessões */}
          <Panel
            action={{ label: "Ver agenda", href: "/agenda" }}
            eyebrow="Agenda"
            icon={CalendarDays}
            title="Próximas sessões"
            padded={false}
          >
            <div className="grid grid-cols-[78px_1.3fr_0.85fr_0.8fr_0.85fr] border-b border-[var(--border)] bg-[var(--surface-2)] px-5 py-2.5 max-lg:hidden">
              <span className="label-strong">Hora</span>
              <span className="label-strong">Paciente</span>
              <span className="label-strong">Confirmação</span>
              <span className="label-strong">Presença</span>
              <span className="label-strong">Financeiro</span>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {sessions.slice(0, 4).map((session) => (
                <SessionRow key={session.id} session={session} />
              ))}
            </div>
          </Panel>
        </div>

        {/* Sidebar column */}
        <aside className="space-y-5">
          <Panel eyebrow="WhatsApp IA" icon={Bot} title="Recepção inteligente">
            <div className="space-y-0">
              <WorkflowStep
                step={1}
                icon={Bot}
                title="Triagem SDR"
                detail="Cobre modalidade, idade e alinhamento financeiro antes de sugerir slots."
              />
              <WorkflowStep
                step={2}
                icon={CalendarDays}
                title="Remarcar ou cancelar"
                detail="Recepcionista consulta agenda, libera horários e aciona fila de espera."
              />
              <WorkflowStep
                step={3}
                icon={Bot}
                title="Handoff protegido"
                detail="Perguntas clínicas viram notificação, sem resposta diagnóstica por IA."
              />
            </div>
            <div className="mt-4 rounded-md border border-[#cddfff] bg-[var(--blue-soft)] p-3">
              <p className="text-[12px] font-semibold text-[var(--blue-text)]">
                Mensagens aprovadas
              </p>
              <p className="mt-0.5 text-[12.5px] leading-snug text-[var(--blue-text)]">
                {messageTemplates.filter((t) => t.approved).length} templates ativos
                — confirmação, documentos, reagendamento e cobrança.
              </p>
            </div>
          </Panel>

          <Panel eyebrow="Automação" icon={FileCheck2} title="Fluxos ativos" padded={false}>
            <div className="divide-y divide-[var(--border)]">
              {automationRules.map((rule) => (
                <div key={rule.id} className="px-5 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="h-card text-[14px]">{rule.title}</p>
                    <Badge variant={rule.status === "active" ? "success" : "neutral"}>
                      {rule.status === "active" ? "Ativo" : "Pausado"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[12.5px] leading-snug text-[var(--ink-3)]">
                    {rule.action}
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel eyebrow="Alertas" icon={Bell} title="Notificações" padded={false}>
            <div className="divide-y divide-[var(--border)]">
              {notifications.map((notification) => (
                <div key={notification.id} className="px-5 py-3.5">
                  <p className="h-card text-[14px]">{notification.title}</p>
                  <p className="mt-1 text-[12.5px] leading-snug text-[var(--ink-3)]">
                    {notification.detail}
                  </p>
                  <p className="mt-2 text-[11px] text-[var(--ink-5)]">
                    {formatDateTime(notification.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel eyebrow="Disponibilidade" icon={Clock3} title="Slots livres" padded={false}>
            <div className="divide-y divide-[var(--border)]">
              {availableSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <div>
                    <p className="text-[13.5px] font-semibold text-[var(--ink)]">
                      {formatDateTime(slot.startsAt)}
                    </p>
                    <p className="mt-0.5 text-[11.5px] text-[var(--ink-4)]">
                      {slot.modality === "online" ? "Online" : "Presencial"}
                    </p>
                  </div>
                  <p className="metric-number text-[14px] font-semibold text-[var(--blue)]">
                    {formatTime(slot.startsAt)}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="label">{label}</dt>
      <dd className="mt-0.5 break-words text-[13.5px] font-medium text-[var(--ink-2)]">
        {value}
      </dd>
    </div>
  );
}
