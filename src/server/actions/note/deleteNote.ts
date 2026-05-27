"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import {
  actionError,
  actionOk,
  fromZodError,
  type ActionResult,
} from "@/lib/action-result";
import { revalidatePath } from "next/cache";

const schema = z.object({ id: z.string().min(1) });

export async function deleteNoteForUser(
  userId: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  const note = await prisma.note.findFirst({
    where: { id: parsed.data.id, userId },
  });
  if (!note) return actionError("Anotação não encontrada.");
  await prisma.note.delete({ where: { id: note.id } });
  return actionOk({ id: note.id });
}

export async function deleteNote(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const r = await deleteNoteForUser(user.id, input);
  if (r.ok) revalidatePath("/pacientes");
  return r;
}
