"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteNote } from "@/server/actions/note/deleteNote";

export function DeleteNoteButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("Apagar esta anotação?")) return;
        start(async () => {
          await deleteNote({ id });
          router.refresh();
        });
      }}
      className="btn btn-ghost btn-sm text-[var(--danger)]"
    >
      Apagar
    </button>
  );
}
