"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ClinicalRecord, Patient } from "@prisma/client";
import { SearchInput } from "../../_components/search-input";
import { EmptyState } from "../../_components/empty-state";
import { Badge } from "../../_components/badge";
import { formatDate } from "@/lib/format/date";
import { FileText } from "lucide-react";

type RWP = ClinicalRecord & { patient: Patient };

export function RecordList({
  records,
  initialSearch,
}: {
  records: RWP[];
  initialSearch: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);

  function onSearch(v: string) {
    setSearch(v);
    const url = new URL(window.location.href);
    if (v) url.searchParams.set("q", v);
    else url.searchParams.delete("q");
    router.replace(url.pathname + url.search);
  }

  return (
    <>
      <div className="mb-4 max-w-md">
        <SearchInput
          placeholder="Buscar por paciente ou template..."
          value={search}
          onChange={onSearch}
        />
      </div>
      {records.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Sem prontuários"
          description="Você verá aqui os prontuários DAP e BIRP criados após cada sessão."
        />
      ) : (
        <div className="space-y-3">
          {records.map((r) => (
            <article key={r.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/prontuarios/${r.id}`}
                    className="text-[15px] font-semibold text-[var(--ink)] hover:text-[var(--blue)]"
                  >
                    {r.patient.name}
                  </Link>
                  <p className="mt-1 text-[12.5px] text-[var(--ink-4)]">
                    Criado em {formatDate(r.createdAt)} · Retenção até{" "}
                    {formatDate(r.retentionUntil)}
                  </p>
                </div>
                <Badge variant="info">{r.template}</Badge>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
