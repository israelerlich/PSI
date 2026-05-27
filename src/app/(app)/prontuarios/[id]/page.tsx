import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { getRecord } from "@/server/queries/record";
import { Badge } from "../../_components/badge";
import { formatDate } from "@/lib/format/date";
import { RecordEditor } from "./RecordEditor";

export const dynamic = "force-dynamic";

export default async function ProntuarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const record = await getRecord(user.id, id);
  if (!record) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          href="/prontuarios"
          className="btn btn-ghost btn-sm -ml-2 inline-flex"
        >
          <ArrowLeft size={14} strokeWidth={1.8} /> Voltar
        </Link>
        <Link
          href={`/api/records/export/${record.id}`}
          target="_blank"
          className="btn btn-secondary btn-sm"
        >
          <Printer size={14} strokeWidth={1.8} /> Exportar
        </Link>
      </div>
      <header className="card p-6 mb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="h-page">{record.patient.name}</h1>
            <p className="mt-1 text-[13px] text-[var(--ink-4)]">
              Criado em {formatDate(record.createdAt)} · Retenção até{" "}
              {formatDate(record.retentionUntil)}
            </p>
          </div>
          <Badge variant="info">{record.template}</Badge>
        </div>
      </header>
      <section className="card p-6">
        <RecordEditor record={record} />
      </section>
    </div>
  );
}
