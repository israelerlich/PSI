"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import {
  createSessionSchema,
  type CreateSessionInput,
} from "@/lib/validators/session";
import {
  actionError,
  actionOk,
  fromZodError,
  type ActionResult,
} from "@/lib/action-result";
import { revalidatePath } from "next/cache";
import type { TherapySession } from "@prisma/client";

export async function createSessionForUser(
  userId: string,
  input: CreateSessionInput,
): Promise<ActionResult<TherapySession>> {
  const parsed = createSessionSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  const data = parsed.data;

  const owns = await prisma.patient.findFirst({
    where: { id: data.patientId, userId },
  });
  if (!owns) return actionError("Paciente não encontrado.");

  const overlap = await prisma.therapySession.findFirst({
    where: {
      userId,
      status: { notIn: ["CANCELADA", "NAO_COMPARECEU"] },
      startsAt: { lt: data.endsAt },
      endsAt: { gt: data.startsAt },
    },
  });
  if (overlap) return actionError("Conflito de horário com outra sessão.");

  const session = await prisma.$transaction(async (tx) => {
    const s = await tx.therapySession.create({
      data: {
        userId,
        patientId: data.patientId,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        modality: data.modality,
        location: data.location,
        serviceType: data.serviceType,
        amountCents: data.amountCents,
        notes: data.notes,
      },
    });
    await tx.billingEntry.create({
      data: {
        userId,
        patientId: data.patientId,
        sessionId: s.id,
        amountCents: data.amountCents,
        serviceType: data.serviceType,
        serviceDate: data.startsAt,
      },
    });
    return s;
  });

  return actionOk(session);
}

export async function createSession(
  input: CreateSessionInput,
): Promise<ActionResult<TherapySession>> {
  const user = await requireUser();
  const r = await createSessionForUser(user.id, input);
  if (r.ok) {
    revalidatePath("/agenda");
    revalidatePath("/");
  }
  return r;
}
