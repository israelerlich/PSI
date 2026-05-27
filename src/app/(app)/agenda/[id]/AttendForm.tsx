"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Patient, TherapySession, RecordTemplate } from "@prisma/client";
import { saveAttendance } from "@/server/actions/session/saveAttendance";

const DAP_LABELS = ["Dado", "Avaliação", "Plano"] as const;
const BIRP_LABELS = ["Behavior", "Intervention", "Response", "Plan"] as const;

export function AttendForm({
  session,
}: {
  session: TherapySession & { patient: Patient };
}) {
  const router = useRouter();
  const [attendance, setAttendance] = useState<
    "present" | "missed" | "excused"
  >("present");
  const [template, setTemplate] = useState<RecordTemplate>("DAP");
  const [fields, setFields] = useState<{ label: string; value: string }[]>(
    DAP_LABELS.map((l) => ({ label: l, value: "" })),
  );
  const [note, setNote] = useState("");
  const [markPaid, setMarkPaid] = useState(session.paymentStatus !== "PAGO");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function setTemplateAndReset(t: RecordTemplate) {
    setTemplate(t);
    const labels = t === "DAP" ? DAP_LABELS : BIRP_LABELS;
    setFields(labels.map((l) => ({ label: l, value: "" })));
  }

  function setField(i: number, value: string) {
    setFields((prev) =>
      prev.map((f, idx) => (idx === i ? { ...f, value } : f)),
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const hasRecord = fields.some((f) => f.value.trim().length > 0);
    start(async () => {
      const r = await saveAttendance({
        sessionId: session.id,
        attendanceStatus: attendance,
        markPaid,
        note: note.trim() || undefined,
        record: hasRecord ? { template, fields } : undefined,
      });
      if (r.ok) {
        router.replace("/agenda");
        router.refresh();
      } else {
        setError(r.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="card p-5">
        <p className="label-strong mb-2">Presença</p>
        <div className="flex gap-2 flex-wrap">
          {(["present", "missed", "excused"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setAttendance(v)}
              className={attendance === v ? "btn btn-primary" : "btn btn-secondary"}
            >
              {v === "present"
                ? "Presente"
                : v === "missed"
                  ? "Falta"
                  : "Justificada"}
            </button>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <p className="label-strong">Prontuário</p>
          <div className="flex gap-2">
            {(["DAP", "BIRP"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTemplateAndReset(t)}
                className={
                  template === t
                    ? "btn btn-primary btn-sm"
                    : "btn btn-secondary btn-sm"
                }
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {fields.map((f, i) => (
            <div key={f.label}>
              <label htmlFor={`f-${i}`} className="label-strong block mb-1">
                {f.label}
              </label>
              <textarea
                id={`f-${i}`}
                value={f.value}
                onChange={(e) => setField(i, e.target.value)}
                rows={3}
                className="input min-h-[88px] py-2 leading-snug"
              />
            </div>
          ))}
        </div>
        <p className="mt-2 text-[12px] text-[var(--ink-5)]">
          Deixe em branco para não criar prontuário desta sessão.
        </p>
      </section>

      <section className="card p-5">
        <label htmlFor="note" className="label-strong block mb-2">
          Anotação rápida
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="input min-h-[88px] py-2 leading-snug"
          placeholder="Algo curto pra lembrar depois (opcional)..."
        />
      </section>

      <section className="card p-5">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={markPaid}
            onChange={(e) => setMarkPaid(e.target.checked)}
          />
          <span className="text-[14px]">Marcar cobrança como paga</span>
        </label>
      </section>

      {error ? (
        <div
          role="alert"
          className="rounded-md border border-[#f3bcbc] bg-[var(--danger-soft)] p-3 text-[13px] text-[var(--danger-text)]"
        >
          {error}
        </div>
      ) : null}

      <div className="flex justify-end">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Salvando..." : "Salvar atendimento"}
        </button>
      </div>
    </form>
  );
}
