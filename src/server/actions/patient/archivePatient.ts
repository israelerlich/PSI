"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { archivePatientSchema } from "@/lib/validators/patient";
import {
  actionError,
  actionOk,
  fromZodError,
  type ActionResult,
} from "@/lib/action-result";
import { revalidatePath } from "next/cache";
import type { Patient } from "@prisma/client";

export async function archivePatientForUser(
  userId: string,
  input: unknown,
): Promise<ActionResult<Patient>> {
  const parsed = archivePatientSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);

  const owns = await prisma.patient.findFirst({
    where: { id: parsed.data.id, userId },
  });
  if (!owns) return actionError("Paciente não encontrado.");

  const patient = await prisma.patient.update({
    where: { id: parsed.data.id },
    data: { archived: parsed.data.archived },
  });
  return actionOk(patient);
}

export async function archivePatient(
  input: unknown,
): Promise<ActionResult<Patient>> {
  const user = await requireUser();
  const r = await archivePatientForUser(user.id, input);
  if (r.ok) revalidatePath("/pacientes");
  return r;
}
