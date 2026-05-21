import type { Patient } from "@/lib/domain";
import { Badge } from "./badge";
import Link from "next/link";

const paymentVariant = {
  PAGO: "success" as const,
  PENDENTE: "warning" as const,
};

const consentLabel = {
  complete: "Consentimentos ok",
  pending: "Consentimento pendente",
  expired: "Consentimento vencido",
};

const consentVariant = {
  complete: "success" as const,
  pending: "warning" as const,
  expired: "danger" as const,
};

export function PatientCard({ patient }: { patient: Patient }) {
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
    <Link
      href={`/pacientes/${patient.id}`}
      className="surface-card block rounded-[10px] bg-white p-4 transition-[transform] duration-150 ease-out hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-stone-950">
            {patient.name}
          </p>
          <p className="mt-1 text-pretty text-sm text-stone-500">
            {patient.whatsapp}
          </p>
        </div>
        <Badge variant={paymentVariant[patient.financialStatus]}>
          {patient.financialStatus}
        </Badge>
      </div>

      {patient.consentStatus ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant={consentVariant[patient.consentStatus]}>
            {consentLabel[patient.consentStatus]}
          </Badge>
          <Badge variant="neutral">{patient.attachmentCount ?? 0} anexos</Badge>
        </div>
      ) : null}

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Info label="Modalidade" value={patient.modality} />
        <Info
          label="Último contato"
          value={
            patient.lastContactAt
              ? formatDateTime(patient.lastContactAt)
              : "Sem registro"
          }
        />
        <Info
          label="Fila"
          value={
            patient.waitlistPosition
              ? `Posição ${patient.waitlistPosition}`
              : "Fora da fila"
          }
        />
        <Info
          label="Pendências"
          value={`${patient.documentsPending ?? 0} documentos`}
        />
        <Info
          label="Continuidade"
          value={
            patient.lastClinicalUpdate
              ? formatDateTime(patient.lastClinicalUpdate)
              : "Sem evolução"
          }
        />
      </dl>
    </Link>
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
