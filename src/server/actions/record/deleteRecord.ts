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

export async function deleteRecordForUser(
  userId: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  const record = await prisma.clinicalRecord.findFirst({
    where: { id: parsed.data.id, userId },
  });
  if (!record) return actionError("Prontuário não encontrado.");
  if (record.retentionUntil > new Date()) {
    return actionError(
      `Não é possível excluir antes do fim da retenção (${record.retentionUntil.toISOString().slice(0, 10)}).`,
    );
  }
  await prisma.clinicalRecord.delete({ where: { id: record.id } });
  return actionOk({ id: record.id });
}

export async function deleteRecord(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const r = await deleteRecordForUser(user.id, input);
  if (r.ok) revalidatePath("/prontuarios");
  return r;
}
