import type { Patient } from "@prisma/client";
import { Badge } from "./badge";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatWhatsappForDisplay } from "@/lib/format/phone";

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
                {patient.whatsapp
                  ? formatWhatsappForDisplay(patient.whatsapp)
                  : patient.email ?? "Sem contato"}
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
            <Badge variant={patient.modality === "online" ? "info" : "neutral"}>
              {patient.modality === "online" ? "Online" : "Presencial"}
            </Badge>
            <Badge variant={consentVariant[patient.consentStatus]}>
              {consentLabel[patient.consentStatus]}
            </Badge>
          </div>

          {patient.generalNotes ? (
            <p className="mt-3 text-[12.5px] text-[var(--ink-3)] line-clamp-2">
              {patient.generalNotes}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
