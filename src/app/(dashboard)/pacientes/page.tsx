"use client";

import { useState } from "react";
import { UsersRound } from "lucide-react";
import { patients } from "@/lib/mock-data";
import { SearchInput } from "../_components/search-input";
import { PatientCard } from "../_components/patient-card";
import { EmptyState } from "../_components/empty-state";

export default function PacientesPage() {
  const [search, setSearch] = useState("");

  const activePatients = patients.filter(
    (p) =>
      !p.archived &&
      (!search || p.name.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label">Pacientes</p>
          <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-[var(--ink)]">
            Lista de pacientes
          </h2>
          <p className="mt-1 text-[13px] text-[var(--ink-4)]">
            {activePatients.length} {activePatients.length === 1 ? "paciente em acompanhamento" : "pacientes em acompanhamento"}
          </p>
        </div>
        <button type="button" className="btn btn-primary">
          + Adicionar paciente
        </button>
      </div>

      <div className="mb-4 max-w-md">
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
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {activePatients.map((patient) => (
            <PatientCard key={patient.id} patient={patient} />
          ))}
        </div>
      )}
    </div>
  );
}
