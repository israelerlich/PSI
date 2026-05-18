import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileCheck2,
  Paperclip,
  ReceiptText,
  UserRound,
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
  const patientBilling = billingEntries.filter((entry) => entry.patientId === id);
  const patientConsents = consents.filter((consent) => consent.patientId === id);
  const patientAttachments = clinicalAttachments.filter(
    (attachment) => attachment.patientId === id,
  );
  const timeline = patientTimeline.filter((item) => item.patientId === id);

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

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
      <Link
        href="/pacientes"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-[var(--brand)] transition-colors"
      >
        <ArrowLeft size={16} />
        Voltar para pacientes
      </Link>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_2fr]">
        {/* Dados do paciente */}
        <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex size-10 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--brand)]">
              <UserRound aria-hidden="true" size={20} strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-stone-950">
                {patient.name}
              </h1>
              <p className="text-sm text-stone-500">{patient.whatsapp}</p>
            </div>
          </div>

          <dl className="space-y-3 text-sm">
            {patient.email ? (
              <Info label="Email" value={patient.email} />
            ) : null}
            {patient.birthDate ? (
              <Info label="Nascimento" value={patient.birthDate} />
            ) : null}
            <Info label="Modalidade" value={patient.modality} />
            <Info
              label="Financeiro"
              value={patient.financialStatus}
            />
            <Info
              label="Próxima sessão"
              value={
                patient.nextSession
                  ? formatDateTime(patient.nextSession)
                  : "Sem sessão"
              }
            />
            {patient.generalNotes ? (
              <Info label="Observações" value={patient.generalNotes} />
            ) : null}
            <Info
              label="Anexos"
              value={`${patientAttachments.length} arquivos protegidos`}
            />
            <Info
              label="Consentimentos"
              value={`${patientConsents.filter((consent) => consent.status === "signed").length}/${patientConsents.length} assinados`}
            />
          </dl>

          {(patient.alerts ?? []).length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {patient.alerts!.map((alert) => (
                <Badge key={alert} variant="warning">
                  {alert}
                </Badge>
              ))}
            </div>
          ) : null}
        </section>

        {/* Sessões, prontuários e anotações */}
        <div className="space-y-6">
          {/* Sessões */}
          <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-950 mb-4">
              Sessões ({patientSessions.length})
            </h2>
            {patientSessions.length === 0 ? (
              <p className="text-sm text-stone-500">Nenhuma sessão registrada.</p>
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
                  {patientSessions.map((session) => (
                    <SessionRow key={session.id} session={session} />
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Prontuários */}
          <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-950 mb-4">
              Prontuários ({patientRecords.length})
            </h2>
            {patientRecords.length === 0 ? (
              <p className="text-sm text-stone-500">Nenhum prontuário registrado.</p>
            ) : (
              <div className="space-y-4">
                {patientRecords.map((record) => (
                  <RecordCard key={record.id} record={record} />
                ))}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <FileCheck2
                aria-hidden="true"
                className="text-[var(--brand)]"
                size={18}
              />
              <h2 className="text-lg font-semibold text-stone-950">
                Contexto clínico
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {timeline.map((item) => (
                <div
                  className="rounded-md bg-[var(--surface-muted)] p-3"
                  key={item.id}
                >
                  <p className="text-sm font-semibold text-stone-950">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-stone-600">
                    {item.detail}
                  </p>
                  <p className="mt-2 text-xs font-medium text-stone-500">
                    {formatDateTime(item.date)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Paperclip
                  aria-hidden="true"
                  className="text-[var(--brand)]"
                  size={18}
                />
                <h2 className="text-lg font-semibold text-stone-950">
                  Anexos e consentimentos
                </h2>
              </div>
              <div className="space-y-3">
                {patientAttachments.map((attachment) => (
                  <Info
                    key={attachment.id}
                    label={attachment.kind}
                    value={attachment.title}
                  />
                ))}
                {patientConsents.map((consent) => (
                  <Info
                    key={consent.id}
                    label={consent.status === "signed" ? "assinado" : "pendente"}
                    value={consent.title}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <ReceiptText
                  aria-hidden="true"
                  className="text-[var(--brand)]"
                  size={18}
                />
                <h2 className="text-lg font-semibold text-stone-950">
                  Cobranças e recibos
                </h2>
              </div>
              <div className="space-y-3">
                {patientBilling.map((entry) => (
                  <div
                    className="rounded-md border border-[var(--line)] p-3"
                    key={entry.id}
                  >
                    <p className="font-semibold text-stone-950">
                      {formatCurrency(entry.amountCents)}
                    </p>
                    <p className="mt-1 text-sm text-stone-500">
                      {entry.serviceType} · {entry.paymentStatus} · {entry.invoiceStatus}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Anotações */}
          {patientNotes.length > 0 ? (
            <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-stone-950 mb-4">
                Anotações ({patientNotes.length})
              </h2>
              <div className="space-y-3">
                {patientNotes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-md bg-[var(--surface-muted)] p-3"
                  >
                    <p className="text-sm text-stone-700">{note.body}</p>
                    <p className="mt-2 text-xs text-stone-500">
                      {formatDateTime(note.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
        {label}
      </dt>
      <dd className="mt-1 font-medium text-stone-800">{value}</dd>
    </div>
  );
}
