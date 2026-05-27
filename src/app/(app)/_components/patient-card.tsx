import type { Patient } from "@/lib/domain";
import { Badge } from "./badge";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

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

  const initials = patient.name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("");

  return (
    <Link
      href={`/pacientes/${patient.id}`}
      className="card card-hover group block p-5"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--blue-soft)] text-[13px] font-semibold text-[var(--blue-text)]">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[14.5px] font-semibold text-[var(--ink)]">
                {patient.name}
              </p>
              <p className="mt-0.5 text-[12.5px] text-[var(--ink-4)]">
                {patient.whatsapp}
              </p>
            </div>
            <ArrowUpRight
              aria-hidden="true"
              size={16}
              strokeWidth={1.8}
              className="mt-1 shrink-0 text-[var(--ink-5)] transition-colors group-hover:text-[var(--blue)]"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge variant={paymentVariant[patient.financialStatus]}>
              {patient.financialStatus === "PAGO" ? "Em dia" : "Pendência"}
            </Badge>
            {patient.consentStatus ? (
              <Badge variant={consentVariant[patient.consentStatus]}>
                {consentLabel[patient.consentStatus]}
              </Badge>
            ) : null}
            <Badge variant="neutral">{patient.attachmentCount ?? 0} anexos</Badge>
          </div>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-[var(--border)] pt-4">
        <Info label="Modalidade" value={patient.modality} />
        <Info
          label="Último contato"
          value={
            patient.lastContactAt ? formatDateTime(patient.lastContactAt) : "—"
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
      </dl>
    </Link>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="label">{label}</dt>
      <dd className="mt-0.5 break-words text-[13px] font-medium text-[var(--ink-2)]">
        {value}
      </dd>
    </div>
  );
}
