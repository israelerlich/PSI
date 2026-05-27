"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Patient } from "@prisma/client";
import { createSession } from "@/server/actions/session/createSession";

export function NewSessionDrawer({
  open,
  onClose,
  patients,
  defaultPriceCents,
}: {
  open: boolean;
  onClose: () => void;
  patients: Patient[];
  defaultPriceCents: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  if (!open) return null;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    const fd = new FormData(e.currentTarget);
    const date = String(fd.get("date") ?? "");
    const startTime = String(fd.get("startTime") ?? "");
    const endTime = String(fd.get("endTime") ?? "");
    const startsAt = new Date(`${date}T${startTime}:00-03:00`);
    const endsAt = new Date(`${date}T${endTime}:00-03:00`);
    const amount = Number(fd.get("amount") ?? defaultPriceCents / 100);
    start(async () => {
      const r = await createSession({
        patientId: String(fd.get("patientId") ?? ""),
        startsAt,
        endsAt,
        modality: String(fd.get("modality") ?? "online") as
          | "online"
          | "presencial",
        location: String(fd.get("location") ?? ""),
        serviceType: String(
          fd.get("serviceType") ?? "Psicoterapia individual",
        ),
        amountCents: Math.round(amount * 100),
      });
      if (r.ok) {
        onClose();
        router.refresh();
      } else {
        setError(r.error);
        setFieldErrors(r.fieldErrors ?? {});
      }
    });
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-[var(--ink)]/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-labelledby="new-session-title"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-[var(--surface)] shadow-[var(--shadow-pop)]"
      >
        <header className="border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
          <h2 id="new-session-title" className="h-section">
            Nova sessão
          </h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm">
            Fechar
          </button>
        </header>
        <form
          onSubmit={onSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-4"
        >
          <div>
            <label htmlFor="patientId" className="label-strong block mb-1">
              Paciente
            </label>
            <select
              id="patientId"
              name="patientId"
              required
              className="input"
            >
              <option value="">Selecione...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {fieldErrors.patientId ? (
              <p className="mt-1 text-[12px] text-[var(--danger)]">
                {fieldErrors.patientId[0]}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor="date" className="label-strong block mb-1">
              Data
            </label>
            <input id="date" name="date" type="date" required className="input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="startTime" className="label-strong block mb-1">
                Início
              </label>
              <input
                id="startTime"
                name="startTime"
                type="time"
                required
                className="input"
              />
            </div>
            <div>
              <label htmlFor="endTime" className="label-strong block mb-1">
                Término
              </label>
              <input
                id="endTime"
                name="endTime"
                type="time"
                required
                className="input"
              />
            </div>
          </div>
          <div>
            <label htmlFor="modality" className="label-strong block mb-1">
              Modalidade
            </label>
            <select
              id="modality"
              name="modality"
              defaultValue="online"
              className="input"
            >
              <option value="online">Online</option>
              <option value="presencial">Presencial</option>
            </select>
          </div>
          <div>
            <label htmlFor="location" className="label-strong block mb-1">
              Local ou link
            </label>
            <input
              id="location"
              name="location"
              required
              defaultValue="Link de videochamada"
              className="input"
            />
          </div>
          <div>
            <label htmlFor="amount" className="label-strong block mb-1">
              Valor (R$)
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0"
              defaultValue={(defaultPriceCents / 100).toFixed(2)}
              className="input"
            />
          </div>

          {error ? (
            <div
              role="alert"
              className="rounded-md border border-[#f3bcbc] bg-[var(--danger-soft)] p-3 text-[13px] text-[var(--danger-text)]"
            >
              {error}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="btn btn-primary"
            >
              {pending ? "Salvando..." : "Agendar"}
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}
