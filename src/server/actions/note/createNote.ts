"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import {
  createNoteSchema,
  type CreateNoteInput,
} from "@/lib/validators/note";
import {
  actionError,
  actionOk,
  fromZodError,
  type ActionResult,
} from "@/lib/action-result";
import { revalidatePath } from "next/cache";
import type { Note } from "@prisma/client";

export async function createNoteForUser(
  userId: string,
  input: CreateNoteInput,
): Promise<ActionResult<Note>> {
  const parsed = createNoteSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  const owns = await prisma.patient.findFirst({
    where: { id: parsed.data.patientId, userId },
  });
  if (!owns) return actionError("Paciente não encontrado.");
  const note = await prisma.note.create({
    data: {
      userId,
      patientId: parsed.data.patientId,
      sessionId: parsed.data.sessionId,
      body: parsed.data.body,
    },
  });
  return actionOk(note);
}

export async function createNote(
  input: CreateNoteInput,
): Promise<ActionResult<Note>> {
  const user = await requireUser();
  const r = await createNoteForUser(user.id, input);
  if (r.ok) revalidatePath(`/pacientes/${input.patientId}`);
  return r;
}
