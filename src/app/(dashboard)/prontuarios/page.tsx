"use client";

import { useState } from "react";
import { FileCheck2, FileText, LockKeyhole, Paperclip } from "lucide-react";
import { clinicalAttachments, consents, records } from "@/lib/mock-data";
import { Panel } from "../_components/panel";
import { SearchInput } from "../_components/search-input";
import { RecordCard } from "../_components/record-card";
import { EmptyState } from "../_components/empty-state";

export default function ProntuariosPage() {
  const [search, setSearch] = useState("");

  const filtered = records.filter(
    (r) =>
      !search ||
      r.patientName.toLowerCase().includes(search.toLowerCase()) ||
      r.template.toLowerCase().includes(search.toLowerCase()),
  );
  const signedConsents = consents.filter(
    (consent) => consent.status === "signed",
  ).length;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
      <Panel
        action={{ label: "Novo prontuário" }}
        eyebrow="Clínico"
        icon={FileText}
        title="Prontuários DAP e BIRP"
      >
        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          <ClinicalMetric
            icon={FileCheck2}
            label="Evoluções"
            value={records.length.toString()}
            detail="Com contexto por sessão"
          />
          <ClinicalMetric
            icon={Paperclip}
            label="Anexos"
            value={clinicalAttachments.length.toString()}
            detail="Documentos protegidos"
          />
          <ClinicalMetric
            icon={LockKeyhole}
            label="Consentimentos"
            value={`${signedConsents}/${consents.length}`}
            detail="Sigilo e continuidade"
          />
        </div>

        <div className="mb-4">
          <SearchInput
            placeholder="Buscar por paciente ou template..."
            value={search}
            onChange={setSearch}
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nenhum prontuário encontrado"
            description="Tente ajustar a busca ou crie um novo prontuário."
            action={{ label: "Novo prontuário" }}
          />
        ) : (
          <div className="space-y-4">
            {filtered.map((record) => (
              <RecordCard key={record.id} record={record} />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function ClinicalMetric({
  detail,
  icon: Icon,
  label,
  value,
}: {
  detail: string;
  icon: React.ComponentType<{
    className?: string;
    size?: number;
    strokeWidth?: number;
  }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-[var(--line)] bg-[var(--surface-muted)] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-stone-500">{label}</p>
        <Icon aria-hidden="true" className="text-[var(--brand)]" size={18} />
      </div>
      <p className="mt-2 text-2xl font-semibold text-stone-950">{value}</p>
      <p className="mt-1 text-sm text-stone-500">{detail}</p>
    </div>
  );
}
