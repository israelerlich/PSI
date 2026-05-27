import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { getPatient } from "@/server/queries/patient";
import { Badge } from "../../_components/badge";
import { Panel } from "../../_components/panel";
import { formatDate, formatDateTime } from "@/lib/format/date";
import {
  formatWhatsappForDisplay,
  whatsappToWaMeLink,
} from "@/lib/format/phone";

export const dynamic = "force-dynamic";

export default async function PacienteDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const patient = await getPatient(user.id, id);
  if (!patient) notFound();

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

      <header className="card mb-5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-[var(--blue-soft)] text-[17px] font-semibold text-[var(--blue-text)]">
              {initials}
            </div>
            <div>
              <h1 className="h-page text-[22px]">{patient.name}</h1>
              <p className="mt-1 text-[13px] text-[var(--ink-4)]">
                {patient.whatsapp ? (
                  <a
                    href={whatsappToWaMeLink(patient.whatsapp)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--blue)] hover:underline"
                  >
                    {formatWhatsappForDisplay(patient.whatsapp)}
                  </a>
                ) : (
                  "Sem WhatsApp"
                )}
                {patient.email ? <> · {patient.email}</> : null}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge
                  variant={patient.modality === "online" ? "info" : "neutral"}
                >
                  {patient.modality === "online" ? "Online" : "Presencial"}
                </Badge>
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
              </div>
            </div>
          </div>
          {patient.whatsapp ? (
            <a
              href={whatsappToWaMeLink(patient.whatsapp)}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
            >
              <MessageCircle size={15} strokeWidth={1.8} /> Abrir WhatsApp
            </a>
          ) : null}
        </div>
      </header>

      <Panel eyebrow="Dados" title="Informações do paciente">
        <dl className="divide-y divide-[var(--border)]">
          {patient.birthDate ? (
            <DataLine label="Nascimento" value={formatDate(patient.birthDate)} />
          ) : null}
          <DataLine label="Modalidade" value={patient.modality} />
          <DataLine
            label="Criado em"
            value={formatDateTime(patient.createdAt)}
          />
          {patient.generalNotes ? (
            <DataLine label="Observações" value={patient.generalNotes} />
          ) : null}
        </dl>
      </Panel>

      <p className="mt-6 text-[13px] text-[var(--ink-4)]">
        Histórico de sessões, prontuários, anotações e financeiro deste paciente
        aparecem aqui depois das próximas fases.
      </p>
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
