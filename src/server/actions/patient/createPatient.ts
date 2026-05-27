"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import {
  createPatientSchema,
  type CreatePatientInput,
} from "@/lib/validators/patient";
import {
  actionOk,
  fromZodError,
  type ActionResult,
} from "@/lib/action-result";
import { revalidatePath } from "next/cache";
import type { Patient } from "@prisma/client";

/** Pure function used by tests (no session). */
export async function createPatientForUser(
  userId: string,
  input: CreatePatientInput,
): Promise<ActionResult<Patient>> {
  const parsed = createPatientSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  const patient = await prisma.patient.create({
    data: {
      userId,
      name: parsed.data.name,
      email: parsed.data.email ?? null,
      whatsapp: parsed.data.whatsapp ?? null,
      birthDate: parsed.data.birthDate,
      modality: parsed.data.modality,
      generalNotes: parsed.data.generalNotes,
    },
  });
  return actionOk(patient);
}

/** Server Action used by client forms. */
export async function createPatient(
  input: CreatePatientInput,
): Promise<ActionResult<Patient>> {
  const user = await requireUser();
  const r = await createPatientForUser(user.id, input);
  if (r.ok) revalidatePath("/pacientes");
  return r;
}
