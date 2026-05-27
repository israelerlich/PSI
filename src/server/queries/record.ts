import { prisma } from "@/lib/db";
import type { ClinicalRecord, Patient, RecordTemplate } from "@prisma/client";

export type RecordWithPatient = ClinicalRecord & { patient: Patient };

export async function listRecords(
  userId: string,
  opts: { search?: string } = {},
): Promise<RecordWithPatient[]> {
  const tpl: RecordTemplate | undefined =
    opts.search?.toUpperCase() === "DAP"
      ? "DAP"
      : opts.search?.toUpperCase() === "BIRP"
        ? "BIRP"
        : undefined;
  return prisma.clinicalRecord.findMany({
    where: {
      userId,
      ...(opts.search && !tpl
        ? {
            patient: {
              name: { contains: opts.search, mode: "insensitive" },
            },
          }
        : {}),
      ...(tpl ? { template: tpl } : {}),
    },
    include: { patient: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getRecord(
  userId: string,
  id: string,
): Promise<RecordWithPatient | null> {
  return prisma.clinicalRecord.findFirst({
    where: { id, userId },
    include: { patient: true },
  });
}

export async function listRecordsForPatient(
  userId: string,
  patientId: string,
): Promise<ClinicalRecord[]> {
  return prisma.clinicalRecord.findMany({
    where: { userId, patientId },
    orderBy: { createdAt: "desc" },
  });
}

export async function countPendingRecords(userId: string): Promise<number> {
  return prisma.therapySession.count({
    where: {
      userId,
      status: "CONCLUIDA",
      documentationStatus: { not: "complete" },
    },
  });
}
