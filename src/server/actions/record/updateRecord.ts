"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { updateRecordSchema } from "@/lib/validators/record";
import {
  actionError,
  actionOk,
  fromZodError,
  type ActionResult,
} from "@/lib/action-result";
import { revalidatePath } from "next/cache";
import type { ClinicalRecord } from "@prisma/client";

export async function updateRecordForUser(
  userId: string,
  input: unknown,
): Promise<ActionResult<ClinicalRecord>> {
  const parsed = updateRecordSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  const owns = await prisma.clinicalRecord.findFirst({
    where: { id: parsed.data.id, userId },
  });
  if (!owns) return actionError("Prontuário não encontrado.");
  const updated = await prisma.clinicalRecord.update({
    where: { id: parsed.data.id },
    data: {
      fields: parsed.data.fields,
      contextSummary: parsed.data.contextSummary,
    },
  });
  return actionOk(updated);
}

export async function updateRecord(
  input: unknown,
): Promise<ActionResult<ClinicalRecord>> {
  const user = await requireUser();
  const r = await updateRecordForUser(user.id, input);
  if (r.ok) {
    revalidatePath("/prontuarios");
    revalidatePath(`/prontuarios/${r.data.id}`);
  }
  return r;
}
