"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { cancelSessionSchema } from "@/lib/validators/session";
import {
  actionError,
  actionOk,
  fromZodError,
  type ActionResult,
} from "@/lib/action-result";
import { revalidatePath } from "next/cache";
import type { TherapySession } from "@prisma/client";

export async function cancelSessionForUser(
  userId: string,
  input: unknown,
): Promise<ActionResult<TherapySession>> {
  const parsed = cancelSessionSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  const owns = await prisma.therapySession.findFirst({
    where: { id: parsed.data.id, userId },
  });
  if (!owns) return actionError("Sessão não encontrada.");
  const noteAppend = parsed.data.reason
    ? `\n[Cancelada] ${parsed.data.reason}`
    : "\n[Cancelada]";
  const updated = await prisma.therapySession.update({
    where: { id: parsed.data.id },
    data: {
      status: "CANCELADA",
      notes: (owns.notes ?? "") + noteAppend,
    },
  });
  return actionOk(updated);
}

export async function cancelSession(
  input: unknown,
): Promise<ActionResult<TherapySession>> {
  const user = await requireUser();
  const r = await cancelSessionForUser(user.id, input);
  if (r.ok) {
    revalidatePath("/agenda");
    revalidatePath("/");
  }
  return r;
}
