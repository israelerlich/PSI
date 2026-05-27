"use client";

import { useState } from "react";
import { FileCheck2, FileText, LockKeyhole, Paperclip } from "lucide-react";
import { clinicalAttachments, consents, records } from "@/lib/mock-data";
import { SearchInput } from "../_components/search-input";
import { RecordCard } from "../_components/record-card";
import { EmptyState } from "../_components/empty-state";
import { StatCard } from "../_components/stat-card";

export default function ProntuariosPage() {
  const [search, setSearch] = useState("");

  const filtered = records.filter(
    (r) =>
      !search ||
      r.patientName.toLowerCase().includes(search.toLowerCase()) ||
      r.template.toLowerCase().includes(search.toLowerCase()),
  );
  const signedConsents = consents.filter((c) => c.status === "signed").length;

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label">Clínico</p>
          <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-[var(--ink)]">
            Prontuários DAP e BIRP
          </h2>
          <p className="mt-1 text-[13px] text-[var(--ink-4)]">
            Registros autorais com retenção mínima de 5 anos.
          </p>
        </div>
        <button type="button" className="btn btn-primary">
          + Novo prontuário
        </button>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          icon={FileCheck2}
          label="Evoluções"
          value={records.length.toString()}
          detail="Com contexto por sessão"
        />
        <StatCard
          icon={Paperclip}
          label="Anexos"
          value={clinicalAttachments.length.toString()}
          detail="Documentos protegidos"
        />
        <StatCard
          icon={LockKeyhole}
          label="Consentimentos"
          value={`${signedConsents}/${consents.length}`}
          detail="Sigilo e continuidade"
        />
      </section>

      <div className="mt-6 max-w-md">
        <SearchInput
          placeholder="Buscar por paciente ou template..."
          value={search}
          onChange={setSearch}
        />
      </div>

      <div className="mt-4 space-y-3">
        {filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nenhum prontuário encontrado"
            description="Tente ajustar a busca ou crie um novo prontuário."
            action={{ label: "Novo prontuário" }}
          />
        ) : (
          filtered.map((record) => (
            <RecordCard key={record.id} record={record} />
          ))
        )}
      </div>
    </div>
  );
}
