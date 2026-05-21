import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserRound } from "lucide-react";
import { patients, sessions, records, notes } from "@/lib/mock-data";
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

  const formatDateTime = (value: string) =>
    new Intl.DateTimeFormat("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    }).format(new Date(value));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
      <Link
        href="/pacientes"
        className="mb-4 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-stone-600 transition-[color] duration-150 ease-out hover:text-[var(--brand)]"
      >
        <ArrowLeft size={16} />
        Voltar para pacientes
      </Link>

      <div className="grid gap-6 xl:grid-cols-[1fr_2fr]">
        {/* Dados do paciente */}
        <section className="surface-card rounded-[10px] bg-white p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex size-10 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--brand)]">
              <UserRound aria-hidden="true" size={20} strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-balance text-xl font-semibold text-stone-950">
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
          <section className="surface-card rounded-[10px] bg-white p-5">
            <h2 className="mb-4 text-balance text-lg font-semibold text-stone-950">
              Sessões ({patientSessions.length})
            </h2>
            {patientSessions.length === 0 ? (
              <p className="text-sm text-stone-500">Nenhuma sessão registrada.</p>
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
                  {patientSessions.map((session) => (
                    <SessionRow key={session.id} session={session} />
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Prontuários */}
          <section className="surface-card rounded-[10px] bg-white p-5">
            <h2 className="mb-4 text-balance text-lg font-semibold text-stone-950">
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

          {/* Anotações */}
          {patientNotes.length > 0 ? (
            <section className="surface-card rounded-[10px] bg-white p-5">
              <h2 className="mb-4 text-balance text-lg font-semibold text-stone-950">
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
      <dd className="mt-1 text-pretty font-medium text-stone-800">{value}</dd>
    </div>
  );
}
