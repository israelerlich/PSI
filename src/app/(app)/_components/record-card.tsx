import type { ClinicalRecord } from "@/lib/domain";
import { Badge } from "./badge";
import { LockKeyhole, Paperclip, Printer } from "lucide-react";
import Link from "next/link";

export function RecordCard({ record }: { record: ClinicalRecord }) {
  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "America/Sao_Paulo",
    }).format(new Date(value));

  return (
    <article className="card overflow-hidden">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/prontuarios/${record.id}`}
              className="h-card text-[15px] text-[var(--ink)] hover:text-[var(--blue)]"
            >
              {record.patientName}
            </Link>
            <Badge variant="info">{record.template}</Badge>
          </div>
          <p className="mt-1 text-[12.5px] text-[var(--ink-4)]">
            Sessão em {formatDate(record.sessionDate)} · criado em{" "}
            {formatDate(record.createdAt)}
          </p>
        </div>
        <Link
          className="btn btn-secondary btn-sm"
          href={`/api/records/export/${record.id}`}
          target="_blank"
        >
          <Printer aria-hidden="true" size={13} strokeWidth={1.8} />
          Exportar
        </Link>
      </header>

      <div className="p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {record.fields.slice(0, 3).map((field) => (
            <div
              key={field.label}
              className="rounded-md bg-[var(--surface-2)] p-3"
            >
              <p className="label">{field.label}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--ink-2)]">
                {field.value}
              </p>
            </div>
          ))}
        </div>

        {record.contextSummary ? (
          <div className="mt-4 rounded-md border border-[#cddfff] bg-[var(--blue-soft)] p-4">
            <p className="text-[12px] font-semibold text-[var(--blue-text)]">
              Contexto e continuidade
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-[var(--blue-text)]">
              {record.contextSummary}
            </p>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {(record.attachments ?? []).map((attachment) => (
            <Badge key={attachment} variant="neutral">
              <Paperclip aria-hidden="true" size={11} strokeWidth={1.8} />
              {attachment}
            </Badge>
          ))}
          {(record.consentIds ?? []).map((consentId) => (
            <Badge key={consentId} variant="success">
              <LockKeyhole aria-hidden="true" size={11} strokeWidth={1.8} />
              Consentimento
            </Badge>
          ))}
        </div>

        <p className="mt-3 text-[11.5px] text-[var(--ink-5)]">
          Retenção obrigatória até {formatDate(record.retentionUntil)}
        </p>
      </div>
    </article>
  );
}
