"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { confirmSessionSchema } from "@/lib/validators/session";
import {
  actionError,
  actionOk,
  fromZodError,
  type ActionResult,
} from "@/lib/action-result";
import { revalidatePath } from "next/cache";
import type { TherapySession } from "@prisma/client";

export async function confirmSessionForUser(
  userId: string,
  input: unknown,
): Promise<ActionResult<TherapySession>> {
  const parsed = confirmSessionSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  const owns = await prisma.therapySession.findFirst({
    where: { id: parsed.data.id, userId },
  });
  if (!owns) return actionError("Sessão não encontrada.");
  const updated = await prisma.therapySession.update({
    where: { id: parsed.data.id },
    data: { confirmationStatus: "confirmed" },
  });
  return actionOk(updated);
}

export async function confirmSession(
  input: unknown,
): Promise<ActionResult<TherapySession>> {
  const user = await requireUser();
  const r = await confirmSessionForUser(user.id, input);
  if (r.ok) revalidatePath("/");
  return r;
}
