"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { createNote } from "@/server/actions/note/createNote";

export function NewNoteForm({ patientId }: { patientId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const body = ref.current?.value.trim() ?? "";
    if (!body) return;
    start(async () => {
      const r = await createNote({ patientId, body });
      if (r.ok) {
        if (ref.current) ref.current.value = "";
        router.refresh();
      } else {
        setError(r.error);
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-2 border-b border-[var(--border)] p-5"
    >
      <label htmlFor="note-body" className="label-strong">
        Nova anotação
      </label>
      <textarea
        id="note-body"
        ref={ref}
        rows={2}
        placeholder="Algo pra lembrar depois..."
        className="input min-h-[64px] py-2 leading-snug"
      />
      {error ? (
        <p className="text-[12px] text-[var(--danger)]">{error}</p>
      ) : null}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary btn-sm"
        >
          {pending ? "Salvando..." : "Adicionar"}
        </button>
      </div>
    </form>
  );
}
