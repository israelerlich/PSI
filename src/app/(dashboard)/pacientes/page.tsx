"use client";

import { useState } from "react";
import { UsersRound } from "lucide-react";
import { patients } from "@/lib/mock-data";
import { Panel } from "../_components/panel";
import { SearchInput } from "../_components/search-input";
import { PatientCard } from "../_components/patient-card";
import { EmptyState } from "../_components/empty-state";

export default function PacientesPage() {
  const [search, setSearch] = useState("");

  const activePatients = patients.filter(
    (p) => !p.archived && (!search || p.name.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
      <Panel
        action={{ label: "Adicionar paciente" }}
        eyebrow="Pacientes"
        icon={UsersRound}
        title="Fichas com contexto"
      >
        <div className="mb-4">
          <SearchInput
            placeholder="Buscar por nome..."
            value={search}
            onChange={setSearch}
          />
        </div>

        {activePatients.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            title="Nenhum paciente encontrado"
            description="Tente ajustar a busca ou adicione um novo paciente."
            action={{ label: "Adicionar paciente" }}
          />
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {activePatients.map((patient) => (
              <PatientCard key={patient.id} patient={patient} />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
