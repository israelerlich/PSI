"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Patient } from "@prisma/client";
import { PatientCard } from "../../_components/patient-card";
import { SearchInput } from "../../_components/search-input";
import { EmptyState } from "../../_components/empty-state";
import { UsersRound } from "lucide-react";
import { NewPatientDrawer } from "./NewPatientDrawer";

export function PatientList({
  patients,
  initialSearch,
}: {
  patients: Patient[];
  initialSearch: string;
}) {
  const [search, setSearch] = useState(initialSearch);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();
  const [, startTransition] = useTransition();

  function onSearch(v: string) {
    setSearch(v);
    startTransition(() => {
      const url = new URL(window.location.href);
      if (v) url.searchParams.set("q", v);
      else url.searchParams.delete("q");
      router.replace(url.pathname + url.search);
    });
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label">Pacientes</p>
          <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-[var(--ink)]">
            Lista de pacientes
          </h2>
          <p className="mt-1 text-[13px] text-[var(--ink-4)]">
            {patients.length}{" "}
            {patients.length === 1
              ? "paciente em acompanhamento"
              : "pacientes em acompanhamento"}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setDrawerOpen(true)}
        >
          + Adicionar paciente
        </button>
      </div>

      <div className="mb-4 max-w-md">
        <SearchInput
          placeholder="Buscar por nome, email ou whatsapp..."
          value={search}
          onChange={onSearch}
        />
      </div>

      {patients.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title={
            search ? "Nenhum paciente encontrado" : "Você ainda não tem pacientes"
          }
          description={
            search
              ? "Tente outro termo de busca."
              : "Adicione seu primeiro paciente para começar."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {patients.map((p) => (
            <PatientCard key={p.id} patient={p} />
          ))}
        </div>
      )}

      <NewPatientDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
