import { prisma } from "@/lib/db";
import type { BillingEntry, Patient } from "@prisma/client";

export type BillingWithPatient = BillingEntry & { patient: Patient };

export async function listBilling(
  userId: string,
): Promise<BillingWithPatient[]> {
  return prisma.billingEntry.findMany({
    where: { userId },
    include: { patient: true },
    orderBy: { serviceDate: "desc" },
  });
}

export async function billingTotals(userId: string): Promise<{
  receivedCents: number;
  pendingCents: number;
  forecastCents: number;
}> {
  const entries = await prisma.billingEntry.findMany({
    where: { userId },
    select: { amountCents: true, paymentStatus: true },
  });
  let received = 0;
  let pending = 0;
  for (const e of entries) {
    if (e.paymentStatus === "PAGO") received += e.amountCents;
    else pending += e.amountCents;
  }
  return {
    receivedCents: received,
    pendingCents: pending,
    forecastCents: received + pending,
  };
}

export async function billingForPatient(
  userId: string,
  patientId: string,
): Promise<BillingEntry[]> {
  return prisma.billingEntry.findMany({
    where: { userId, patientId },
    orderBy: { serviceDate: "desc" },
  });
}
