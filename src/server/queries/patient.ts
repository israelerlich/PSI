import { prisma } from "@/lib/db";
import type { Patient } from "@prisma/client";

export async function listPatients(
  userId: string,
  opts: { search?: string; includeArchived?: boolean } = {},
): Promise<Patient[]> {
  return prisma.patient.findMany({
    where: {
      userId,
      archived: opts.includeArchived ? undefined : false,
      ...(opts.search
        ? {
            OR: [
              { name: { contains: opts.search, mode: "insensitive" } },
              { email: { contains: opts.search, mode: "insensitive" } },
              { whatsapp: { contains: opts.search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
  });
}

export async function getPatient(
  userId: string,
  id: string,
): Promise<Patient | null> {
  return prisma.patient.findFirst({ where: { id, userId } });
}

export async function countActivePatients(userId: string): Promise<number> {
  return prisma.patient.count({ where: { userId, archived: false } });
}
