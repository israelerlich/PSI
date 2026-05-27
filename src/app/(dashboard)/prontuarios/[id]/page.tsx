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
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          href="/prontuarios"
          className="btn btn-ghost btn-sm -ml-2 inline-flex"
        >
          <ArrowLeft size={14} strokeWidth={1.8} />
          Voltar para prontuários
        </Link>
        <Link
          href={`/api/records/export/${record.id}`}
          target="_blank"
          className="btn btn-secondary btn-sm"
        >
          <Printer size={14} strokeWidth={1.8} />
          Exportar
        </Link>
      </div>

      <section className="card">
        <header className="border-b border-[var(--border)] px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="h-page">{record.patientName}</h1>
              <p className="mt-1 text-[13px] text-[var(--ink-4)]">
                Sessão em {formatDate(record.sessionDate)} · criado em{" "}
                {formatDate(record.createdAt)}
              </p>
            </div>
            <Badge variant="info">{record.template}</Badge>
          </div>
        </header>

        <div className="p-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {record.fields.map((field) => (
              <div
                key={field.label}
                className="rounded-md bg-[var(--surface-2)] p-4"
              >
                <p className="label">{field.label}</p>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--ink-2)]">
                  {field.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-md border border-[#cddfff] bg-[var(--blue-soft)] p-4">
            <p className="text-[12px] font-semibold text-[var(--blue-text)]">
              Retenção obrigatória
            </p>
            <p className="mt-0.5 text-[13px] text-[var(--blue-text)]">
              Até{" "}
              <span className="metric-number font-semibold">
                {formatDate(record.retentionUntil)}
              </span>{" "}
              — cinco anos conforme política da Clínica IA.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
