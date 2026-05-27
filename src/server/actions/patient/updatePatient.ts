"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import {
  updatePatientSchema,
  type UpdatePatientInput,
} from "@/lib/validators/patient";
import {
  actionError,
  actionOk,
  fromZodError,
  type ActionResult,
} from "@/lib/action-result";
import { revalidatePath } from "next/cache";
import type { Patient } from "@prisma/client";

export async function updatePatientForUser(
  userId: string,
  input: UpdatePatientInput,
): Promise<ActionResult<Patient>> {
  const parsed = updatePatientSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);

  const owns = await prisma.patient.findFirst({
    where: { id: parsed.data.id, userId },
  });
  if (!owns) return actionError("Paciente não encontrado.");

  const { id, ...data } = parsed.data;
  const patient = await prisma.patient.update({
    where: { id },
    data: {
      ...data,
      email: data.email ?? null,
      whatsapp: data.whatsapp ?? null,
    },
  });
  return actionOk(patient);
}

export async function updatePatient(
  input: UpdatePatientInput,
): Promise<ActionResult<Patient>> {
  const user = await requireUser();
  const r = await updatePatientForUser(user.id, input);
  if (r.ok) {
    revalidatePath("/pacientes");
    revalidatePath(`/pacientes/${r.data.id}`);
  }
  return r;
}
