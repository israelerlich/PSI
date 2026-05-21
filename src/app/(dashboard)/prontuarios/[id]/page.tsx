import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { records } from "@/lib/mock-data";
import { Badge } from "../../_components/badge";

export default async function ProntuarioDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const record = records.find((r) => r.id === id);
  if (!record) notFound();

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "America/Sao_Paulo",
    }).format(new Date(value));

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/prontuarios"
          className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-stone-600 transition-[color] duration-150 ease-out hover:text-[var(--brand)]"
        >
          <ArrowLeft size={16} />
          Voltar para prontuários
        </Link>

        <a
          className="tactile inline-flex h-10 items-center gap-2 rounded-md bg-white pl-3.5 pr-4 text-sm font-semibold text-stone-600 shadow-[var(--shadow-border)] hover:bg-[var(--surface-muted)] hover:shadow-[var(--shadow-border-hover)]"
          href={`/api/records/export/${record.id}`}
          target="_blank"
        >
          <Printer aria-hidden="true" size={15} />
          Exportar
        </a>
      </div>

      <section className="surface-card rounded-[10px] bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div>
            <h1 className="text-balance text-xl font-semibold text-stone-950">
              {record.patientName}
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Sessão em {formatDate(record.sessionDate)} · criado em{" "}
              {formatDate(record.createdAt)}
            </p>
          </div>
          <Badge variant="neutral">{record.template}</Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {record.fields.map((field) => (
            <div
              className="rounded-md bg-[var(--surface-muted)] p-4"
              key={field.label}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                {field.label}
              </p>
              <p className="mt-2 text-pretty text-sm leading-6 text-stone-700">
                {field.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-[var(--line)]">
          <p className="text-pretty text-sm text-stone-500">
            Retenção obrigatória até {formatDate(record.retentionUntil)} (5 anos)
          </p>
        </div>
      </section>
    </div>
  );
}
