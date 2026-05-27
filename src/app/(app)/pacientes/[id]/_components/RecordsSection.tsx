import Link from "next/link";
import type { ClinicalRecord } from "@prisma/client";
import { Panel } from "../../../_components/panel";
import { Badge } from "../../../_components/badge";
import { formatDate } from "@/lib/format/date";
import { FileText } from "lucide-react";

export function RecordsSection({ records }: { records: ClinicalRecord[] }) {
  return (
    <Panel eyebrow="Clínico" title="Prontuários" icon={FileText} padded={false}>
      {records.length === 0 ? (
        <p className="px-5 py-6 text-[13px] text-[var(--ink-4)]">
          Nenhum prontuário ainda.
        </p>
      ) : (
        <div className="divide-y divide-[var(--border)]">
          {records.map((r) => (
            <article
              key={r.id}
              className="row-hover flex items-center justify-between gap-3 px-5 py-3"
            >
              <Link
                href={`/prontuarios/${r.id}`}
                className="text-[14px] font-semibold text-[var(--ink)] hover:text-[var(--blue)]"
              >
                {formatDate(r.createdAt)}
              </Link>
              <Badge variant="info">{r.template}</Badge>
            </article>
          ))}
        </div>
      )}
    </Panel>
  );
}
