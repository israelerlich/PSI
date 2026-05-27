"use client";

import { useRouter } from "next/navigation";
import { PatientForm } from "@/components/features/PatientForm";
import { createPatient } from "@/server/actions/patient/createPatient";

export function NewPatientDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  if (!open) return null;
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-[var(--ink)]/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-labelledby="new-patient-title"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-[var(--surface)] shadow-[var(--shadow-pop)]"
      >
        <header className="border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
          <h2 id="new-patient-title" className="h-section">
            Novo paciente
          </h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm">
            Fechar
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          <PatientForm
            submitLabel="Adicionar"
            onSubmit={async (input) => {
              const r = await createPatient(input);
              if (r.ok) {
                onClose();
                router.refresh();
              }
              return r;
            }}
            onCancel={onClose}
          />
        </div>
      </aside>
    </>
  );
}
