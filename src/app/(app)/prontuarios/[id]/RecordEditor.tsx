"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ClinicalRecord } from "@prisma/client";
import { updateRecord } from "@/server/actions/record/updateRecord";

type Field = { label: string; value: string };

export function RecordEditor({ record }: { record: ClinicalRecord }) {
  const router = useRouter();
  const [fields, setFields] = useState<Field[]>(record.fields as Field[]);
  const [contextSummary, setContextSummary] = useState(
    record.contextSummary ?? "",
  );
  const [pending, start] = useTransition();
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  function setField(i: number, value: string) {
    setFields((prev) =>
      prev.map((f, idx) => (idx === i ? { ...f, value } : f)),
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = await updateRecord({
        id: record.id,
        fields,
        contextSummary: contextSummary || undefined,
      });
      if (r.ok) {
        setSavedAt(new Date());
        router.refresh();
      } else {
        setError(r.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {fields.map((f, i) => (
        <div key={f.label}>
          <label htmlFor={`f-${i}`} className="label-strong block mb-1">
            {f.label}
          </label>
          <textarea
            id={`f-${i}`}
            value={f.value}
            onChange={(e) => setField(i, e.target.value)}
            rows={4}
            className="input min-h-[112px] py-2 leading-snug"
          />
        </div>
      ))}
      <div>
        <label htmlFor="ctx" className="label-strong block mb-1">
          Contexto e continuidade
        </label>
        <textarea
          id="ctx"
          value={contextSummary}
          onChange={(e) => setContextSummary(e.target.value)}
          rows={3}
          className="input min-h-[88px] py-2 leading-snug"
          placeholder="Opcional"
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
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-[var(--ink-5)]">
          {savedAt ? `Salvo às ${savedAt.toLocaleTimeString("pt-BR")}` : ""}
        </span>
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}
