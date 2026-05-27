import { requireUser } from "@/lib/auth-helpers";
import { listRecords } from "@/server/queries/record";
import { RecordList } from "./_components/RecordList";

export const dynamic = "force-dynamic";

export default async function ProntuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireUser();
  const { q = "" } = await searchParams;
  const records = await listRecords(user.id, { search: q });
  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6">
        <p className="label">Clínico</p>
        <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-[var(--ink)]">
          Prontuários DAP e BIRP
        </h2>
        <p className="mt-1 text-[13px] text-[var(--ink-4)]">
          {records.length} {records.length === 1 ? "registro" : "registros"}
        </p>
      </div>
      <RecordList records={records} initialSearch={q} />
    </div>
  );
}
