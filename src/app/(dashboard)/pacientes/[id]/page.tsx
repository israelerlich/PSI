import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileCheck2,
  Paperclip,
  ReceiptText,
} from "lucide-react";
import {
  billingEntries,
  clinicalAttachments,
  consents,
  notes,
  patientTimeline,
  patients,
  records,
  sessions,
} from "@/lib/mock-data";
import { Badge } from "../../_components/badge";
import { SessionRow } from "../../_components/session-row";
import { RecordCard } from "../../_components/record-card";
import { Panel } from "../../_components/panel";

export default async function PacienteDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = patients.find((p) => p.id === id);
  if (!patient) notFound();

  const patientSessions = sessions.filter((s) => s.patientId === id);
  const patientRecords = records.filter((r) => r.patientId === id);
  const patientNotes = notes.filter((n) => n.patientId === id);
  const patientBilling = billingEntries.filter((e) => e.patientId === id);
  const patientConsents = consents.filter((c) => c.patientId === id);
  const patientAttachments = clinicalAttachments.filter(
    (a) => a.patientId === id,
  );
  const timeline = patientTimeline.filter((t) => t.patientId === id);

  const formatDateTime = (value: string) =>
    new Intl.DateTimeFormat("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    }).format(new Date(value));

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      currency: "BRL",
      style: "currency",
    }).format(value / 100);

  const initials = patient.name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("");

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
      <Link
        href="/pacientes"
        className="btn btn-ghost btn-sm -ml-2 mb-4 inline-flex"
      >
        <ArrowLeft size={14} strokeWidth={1.8} />
        Voltar para pacientes
      </Link>

      {/* Patient header */}
      <header className="card mb-5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-[var(--blue-soft)] text-[17px] font-semibold text-[var(--blue-text)]">
              {initials}
            </div>
            <div>
              <h1 className="h-page text-[22px]">{patient.name}</h1>
              <p className="mt-1 text-[13px] text-[var(--ink-4)]">
                {patient.whatsapp}
                {patient.email ? <> · {patient.email}</> : null}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge
                  variant={
                    patient.financialStatus === "PAGO" ? "success" : "warning"
                  }
                >
                  {patient.financialStatus === "PAGO"
                    ? "Em dia"
                    : "Pagamento pendente"}
                </Badge>
                {patient.consentStatus ? (
                  <Badge
                    variant={
                      patient.consentStatus === "complete"
                        ? "success"
                        : patient.consentStatus === "expired"
                          ? "danger"
                          : "warning"
                    }
                  >
                    Consentimento {patient.consentStatus}
                  </Badge>
                ) : null}
                <Badge variant="neutral">
                  {patient.modality === "online" ? "Online" : "Presencial"}
                </Badge>
              </div>
            </div>
          </div>
          <button type="button" className="btn btn-secondary">
            Editar ficha
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[340px_1fr]">
        <aside className="space-y-5">
          <Panel eyebrow="Dados" title="Informações do paciente">
            <dl className="space-y-0 divide-y divide-[var(--border)]">
              {patient.birthDate ? (
                <DataLine label="Nascimento" value={patient.birthDate} />
              ) : null}
              <DataLine label="Modalidade" value={patient.modality} />
              <DataLine
                label="Próxima sessão"
                value={
                  patient.nextSession
                    ? formatDateTime(patient.nextSession)
                    : "Sem sessão"
                }
              />
              {patient.generalNotes ? (
                <DataLine label="Observações" value={patient.generalNotes} />
              ) : null}
              <DataLine
                label="Anexos"
                value={`${patientAttachments.length} arquivos`}
              />
              <DataLine
                label="Consentimentos"
                value={`${patientConsents.filter((c) => c.status === "signed").length}/${patientConsents.length} assinados`}
              />
            </dl>
          </Panel>

          {(patient.alerts ?? []).length > 0 ? (
            <Panel eyebrow="Atenção" title="Alertas">
              <div className="flex flex-wrap gap-1.5">
                {patient.alerts!.map((alert) => (
                  <Badge key={alert} variant="warning">
                    {alert}
                  </Badge>
                ))}
              </div>
            </Panel>
          ) : null}
        </aside>

        <div className="space-y-5">
          <Panel
            eyebrow="Sessões"
            title={`Histórico (${patientSessions.length})`}
            padded={false}
          >
            {patientSessions.length === 0 ? (
              <p className="px-5 py-6 text-[13px] text-[var(--ink-4)]">
                Nenhuma sessão registrada.
              </p>
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
                  {patientSessions.map((session) => (
                    <SessionRow key={session.id} session={session} />
                  ))}
                </div>
              </>
            )}
          </Panel>

          {patientRecords.length > 0 ? (
            <div className="space-y-3">
              <h3 className="h-section">
                Prontuários ({patientRecords.length})
              </h3>
              {patientRecords.map((record) => (
                <RecordCard key={record.id} record={record} />
              ))}
            </div>
          ) : null}

          <Panel
            eyebrow="Contexto"
            icon={FileCheck2}
            title="Linha do tempo clínica"
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {timeline.map((item) => (
                <div
                  key={item.id}
                  className="rounded-md bg-[var(--surface-2)] p-3"
                >
                  <p className="text-[13.5px] font-semibold text-[var(--ink)]">
                    {item.title}
                  </p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--ink-3)]">
                    {item.detail}
                  </p>
                  <p className="mt-2 text-[11px] text-[var(--ink-5)]">
                    {formatDateTime(item.date)}
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Panel
              eyebrow="Documentação"
              icon={Paperclip}
              title="Anexos e consentimentos"
            >
              <div className="space-y-0 divide-y divide-[var(--border)]">
                {patientAttachments.map((attachment) => (
                  <DataLine
                    key={attachment.id}
                    label={attachment.kind}
                    value={attachment.title}
                  />
                ))}
                {patientConsents.map((consent) => (
                  <DataLine
                    key={consent.id}
                    label={consent.status === "signed" ? "assinado" : "pendente"}
                    value={consent.title}
                  />
                ))}
              </div>
            </Panel>

            <Panel
              eyebrow="Financeiro"
              icon={ReceiptText}
              title="Cobranças e recibos"
            >
              <div className="space-y-2">
                {patientBilling.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-md border border-[var(--border)] p-3"
                  >
                    <p className="metric-number text-[15px] font-semibold text-[var(--ink)]">
                      {formatCurrency(entry.amountCents)}
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-[var(--ink-4)]">
                      {entry.serviceType} · {entry.paymentStatus} ·{" "}
                      {entry.invoiceStatus}
                    </p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          {patientNotes.length > 0 ? (
            <Panel eyebrow="Diário" title={`Anotações (${patientNotes.length})`}>
              <div className="space-y-3">
                {patientNotes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-md bg-[var(--surface-2)] p-3"
                  >
                    <p className="text-[13.5px] leading-relaxed text-[var(--ink-2)]">
                      {note.body}
                    </p>
                    <p className="mt-2 text-[11px] text-[var(--ink-5)]">
                      {formatDateTime(note.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DataLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-baseline gap-3 py-2.5">
      <dt className="label">{label}</dt>
      <dd className="text-[13.5px] font-medium text-[var(--ink-2)]">{value}</dd>
    </div>
  );
}
