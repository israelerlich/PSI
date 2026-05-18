"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { records } from "@/lib/mock-data";
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

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
      <Panel
        action={{ label: "Novo prontuário" }}
        eyebrow="Clínico"
        icon={FileText}
        title="Prontuários DAP e BIRP"
      >
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
