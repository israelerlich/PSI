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

const todayIso = "2026-05-16";

const activePatients = patients.filter((patient) => !patient.archived);
const todaySessions = sessions.filter((session) =>
  session.startsAt.startsWith(todayIso),
);
const pendingPayments = sessions.filter(
  (session) => session.paymentStatus === "PENDENTE",
).length;
const readyInvoices = billingEntries.filter(
  (entry) => entry.invoiceStatus === "ready" || entry.invoiceStatus === "queued",
).length;
const confirmedSessions = sessions.filter(
  (session) => session.confirmationStatus === "confirmed",
).length;
const concludedSessions = sessions.filter(
  (session) => session.status === "CONCLUIDA",
).length;
const attendanceRate = Math.round(
  (sessions.filter((session) => session.attendanceStatus === "present").length /
    Math.max(1, concludedSessions)) *
    100,
);
const openRecords = sessions.filter(
  (session) => session.documentationStatus !== "complete",
).length;
const focusPatient =
  patients.find((patient) => patient.id === "pat_ana") ?? patients[0];
const focusPatientSessions = sessions.filter(
  (session) => session.patientId === focusPatient.id,
);
const focusPatientRecord = records.find(
  (record) => record.patientId === focusPatient.id,
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
    meta: "Antes do fim do dia",
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
    <div
      className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 py-6 md:px-8 xl:grid-cols-[minmax(0,1fr)_380px]"
      id="conteudo"
    >
      <div className="space-y-6">
        {/* Indicadores principais */}
        <section
          aria-label="Indicadores principais"
          className="grid scroll-mt-24 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
          id="hoje"
        >
          <StatCard
            icon={CalendarClock}
            label="Sessões hoje"
            value={todaySessions.length.toString()}
            detail={`${confirmedSessions} confirmadas automaticamente`}
          />
          <StatCard
            icon={UsersRound}
            label="Pacientes ativos"
            value={activePatients.length.toString()}
            detail="Ficha, histórico e fila"
          />
          <StatCard
            icon={WalletCards}
            label="Recebíveis"
            value={pendingPayments.toString()}
            detail="Pix, recibos e NFS-e"
          />
          <StatCard
            icon={FileCheck2}
            label="Presença"
            value={`${attendanceRate}%`}
            detail="Lembretes reduzem faltas"
          />
        </section>

        {/* Fila + Paciente em foco */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <Panel
            eyebrow="Fila de trabalho"
            icon={ClipboardCheck}
            title="Prioridades administrativas"
          >
            <div className="space-y-3">
              {operationalQueue.map((item) => (
                <QueueItem
                  detail={item.detail}
                  icon={item.icon}
                  key={item.title}
                  meta={item.meta}
                  title={item.title}
                  tone={item.tone}
                />
              ))}
            </div>
          </Panel>

          <Panel
            eyebrow="Paciente em foco"
            icon={UserRound}
            title={focusPatient.name}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_0.9fr]">
              <div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <Info label="WhatsApp" value={focusPatient.whatsapp} />
                  <Info label="Modalidade" value={focusPatient.modality} />
                  <Info
                    label="Próxima sessão"
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
                </dl>

                <div className="mt-4 flex flex-wrap gap-2">
                  {(focusPatient.alerts ?? []).map((alert) => (
                    <Badge key={alert} variant="neutral">
                      {alert}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="rounded-md bg-[var(--surface-muted)] p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                  Linha clínica
                </p>
                <p className="mt-2 text-sm leading-6 text-stone-700">
                  {focusPatientSessions.length} sessões registradas,{" "}
                  {focusPatientRecord
                    ? "prontuário iniciado"
                    : "sem prontuário"}
                  ,{" "}
                  {
                    notes.filter((note) => note.patientId === focusPatient.id)
                      .length
                  }{" "}
                  anotação.
                </p>
              </div>
            </div>
          </Panel>
        </section>

        {/* Próximas sessões (preview) */}
        <section>
          <Panel
            action={{ label: "Ver agenda", href: "/agenda" }}
            eyebrow="Agenda"
            icon={CalendarDays}
            title="Próximas sessões"
          >
            <div className="overflow-hidden rounded-md border border-[var(--line)]">
              <div className="grid grid-cols-[80px_1.2fr_0.9fr_0.85fr_0.95fr] bg-[var(--surface-muted)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-stone-600 max-lg:hidden">
                <span>Hora</span>
                <span>Paciente</span>
                <span>Confirmação</span>
                <span>Presença</span>
                <span>Financeiro</span>
              </div>
              <div className="divide-y divide-[var(--line)]">
                {sessions.slice(0, 4).map((session) => (
                  <SessionRow key={session.id} session={session} />
                ))}
              </div>
            </div>
          </Panel>
        </section>
      </div>

      {/* Coluna lateral */}
      <aside className="space-y-6">
        <Panel eyebrow="WhatsApp IA" icon={Bot} title="Recepção inteligente">
          <div className="grid grid-cols-1 gap-3">
            <WorkflowStep
              icon={Bot}
              title="Triagem SDR"
              detail="Cobre modalidade, idade e alinhamento financeiro antes de sugerir slots."
            />
            <WorkflowStep
              icon={CalendarDays}
              title="Remarcar ou cancelar"
              detail="Recepcionista consulta agenda, libera horários e aciona fila de espera."
            />
            <WorkflowStep
              icon={Bot}
              title="Handoff protegido"
              detail="Perguntas clínicas viram notificação, sem resposta diagnóstica por IA."
            />
          </div>

          <div className="mt-5 rounded-md border border-teal-200 bg-teal-50 p-3">
            <p className="text-sm font-semibold text-teal-900">
              Mensagens aprovadas
            </p>
            <p className="mt-2 text-sm leading-6 text-teal-800">
              {messageTemplates.filter((template) => template.approved).length} templates ativos para confirmação, documentos, reagendamento e cobrança.
            </p>
          </div>
        </Panel>

        <Panel eyebrow="Automação" icon={FileCheck2} title="Fluxos ativos">
          <div className="space-y-3">
            {automationRules.map((rule) => (
              <div
                className="rounded-md border border-[var(--line)] p-3"
                key={rule.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-stone-950">{rule.title}</p>
                  <Badge variant={rule.status === "active" ? "success" : "neutral"}>
                    {rule.status === "active" ? "Ativo" : "Pausado"}
                  </Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  {rule.action}
                </p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel eyebrow="Alertas" icon={Bell} title="Notificações">
          <div className="divide-y divide-[var(--line)]">
            {notifications.map((notification) => (
              <div
                className="py-3 first:pt-0 last:pb-0"
                key={notification.id}
              >
                <p className="font-medium text-stone-950">
                  {notification.title}
                </p>
                <p className="mt-1 text-sm leading-6 text-stone-600">
                  {notification.detail}
                </p>
                <p className="mt-2 text-xs font-medium text-stone-500">
                  {formatDateTime(notification.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel eyebrow="Disponibilidade" icon={Clock3} title="Slots livres">
          <div className="space-y-3">
            {availableSlots.map((slot) => (
              <div
                className="flex items-center justify-between gap-3 rounded-md border border-[var(--line)] p-3"
                key={slot.id}
              >
                <div>
                  <p className="font-semibold text-stone-950">
                    {formatDateTime(slot.startsAt)}
                  </p>
                  <p className="mt-1 text-sm text-stone-500">
                    {slot.modality} · {formatTime(slot.startsAt)}-
                    {formatTime(slot.endsAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </aside>
    </div>
  );
}

function WorkflowStep({
  detail,
  icon: Icon,
  title,
}: {
  detail: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  title: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-md bg-teal-50 text-[var(--brand)]">
        <Icon aria-hidden="true" size={17} strokeWidth={2} />
      </div>
      <div>
        <p className="font-semibold text-stone-950">{title}</p>
        <p className="mt-1 text-sm leading-6 text-stone-600">{detail}</p>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
        {label}
      </dt>
      <dd className="mt-1 break-words font-medium text-stone-800">{value}</dd>
    </div>
  );
}
