import type { Note } from "@prisma/client";
import { Panel } from "../../../_components/panel";
import { formatDateTime } from "@/lib/format/date";
import { NotebookText } from "lucide-react";
import { NewNoteForm } from "./NewNoteForm";
import { DeleteNoteButton } from "./DeleteNoteButton";

export function NotesSection({
  notes,
  patientId,
}: {
  notes: Note[];
  patientId: string;
}) {
  return (
    <Panel
      eyebrow="Diário"
      title="Anotações"
      icon={NotebookText}
      padded={false}
    >
      <NewNoteForm patientId={patientId} />
      {notes.length === 0 ? (
        <p className="px-5 py-6 text-[13px] text-[var(--ink-4)]">
          Nenhuma anotação ainda.
        </p>
      ) : (
        <div className="divide-y divide-[var(--border)]">
          {notes.map((n) => (
            <article
              key={n.id}
              className="row-hover grid grid-cols-[1fr_auto] gap-3 px-5 py-3 items-start"
            >
              <div>
                <p className="text-[13.5px] text-[var(--ink-2)] whitespace-pre-wrap">
                  {n.body}
                </p>
                <p className="mt-1 text-[11.5px] text-[var(--ink-5)]">
                  {formatDateTime(n.createdAt)}
                </p>
              </div>
              <DeleteNoteButton id={n.id} />
            </article>
          ))}
        </div>
      )}
    </Panel>
  );
}
