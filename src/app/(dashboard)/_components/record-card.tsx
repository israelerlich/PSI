import type { ClinicalRecord } from "@/lib/domain";
import { Badge } from "./badge";
import { Printer } from "lucide-react";
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
    <article className="surface-card rounded-[10px] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-stone-950">
            <Link
              href={`/prontuarios/${record.id}`}
              className="transition-[color] duration-150 ease-out hover:text-[var(--brand)]"
            >
              {record.patientName}
            </Link>
          </p>
          <p className="mt-1 text-sm text-stone-500">
            Sessão em {formatDate(record.sessionDate)} · criado em{" "}
            {formatDate(record.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="neutral">{record.template}</Badge>
          <a
            className="tactile inline-flex h-10 items-center gap-2 rounded-md bg-white pl-3.5 pr-4 text-sm font-semibold text-stone-600 shadow-[var(--shadow-border)] hover:bg-[var(--surface-muted)] hover:shadow-[var(--shadow-border-hover)]"
            href={`/api/records/export/${record.id}`}
            target="_blank"
          >
            <Printer aria-hidden="true" size={15} />
            Exportar
          </a>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {record.fields.slice(0, 3).map((field) => (
          <div className="rounded-md bg-[var(--surface-muted)] p-3" key={field.label}>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
              {field.label}
            </p>
            <p className="mt-2 text-pretty text-sm leading-6 text-stone-700">
              {field.value}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm font-medium text-stone-500">
        Retenção até {formatDate(record.retentionUntil)}
      </p>
    </article>
  );
}
