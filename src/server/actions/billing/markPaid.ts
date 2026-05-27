"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { markPaidSchema } from "@/lib/validators/billing";
import {
  actionError,
  actionOk,
  fromZodError,
  type ActionResult,
} from "@/lib/action-result";
import { revalidatePath } from "next/cache";
import type { BillingEntry } from "@prisma/client";

export async function markPaidForUser(
  userId: string,
  input: unknown,
): Promise<ActionResult<BillingEntry>> {
  const parsed = markPaidSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  const billing = await prisma.billingEntry.findFirst({
    where: { id: parsed.data.billingId, userId },
  });
  if (!billing) return actionError("Cobrança não encontrada.");
  const updated = await prisma.$transaction(async (tx) => {
    const b = await tx.billingEntry.update({
      where: { id: billing.id },
      data: { paymentStatus: "PAGO", paidAt: new Date() },
    });
    if (billing.sessionId) {
      await tx.therapySession.update({
        where: { id: billing.sessionId },
        data: { paymentStatus: "PAGO" },
      });
    }
    return b;
  });
  return actionOk(updated);
}

export async function markPaid(
  input: unknown,
): Promise<ActionResult<BillingEntry>> {
  const user = await requireUser();
  const r = await markPaidForUser(user.id, input);
  if (r.ok) {
    revalidatePath("/financeiro");
    revalidatePath("/");
  }
  return r;
}
