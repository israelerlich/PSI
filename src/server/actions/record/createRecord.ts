"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import {
  createRecordSchema,
  type CreateRecordInput,
} from "@/lib/validators/record";
import {
  actionError,
  actionOk,
  fromZodError,
  type ActionResult,
} from "@/lib/action-result";
import { revalidatePath } from "next/cache";
import type { ClinicalRecord } from "@prisma/client";

export async function createRecordForUser(
  userId: string,
  input: CreateRecordInput,
): Promise<ActionResult<ClinicalRecord>> {
  const parsed = createRecordSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  const data = parsed.data;
  const owns = await prisma.patient.findFirst({
    where: { id: data.patientId, userId },
  });
  if (!owns) return actionError("Paciente não encontrado.");

  const retention = new Date();
  retention.setFullYear(retention.getFullYear() + 5);

  const record = await prisma.clinicalRecord.create({
    data: {
      userId,
      patientId: data.patientId,
      sessionId: data.sessionId,
      template: data.template,
      fields: data.fields,
      contextSummary: data.contextSummary,
      retentionUntil: retention,
    },
  });
  return actionOk(record);
}

export async function createRecord(
  input: CreateRecordInput,
): Promise<ActionResult<ClinicalRecord>> {
  const user = await requireUser();
  const r = await createRecordForUser(user.id, input);
  if (r.ok) {
    revalidatePath("/prontuarios");
    revalidatePath(`/pacientes/${input.patientId}`);
  }
  return r;
}
