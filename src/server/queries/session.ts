import { prisma } from "@/lib/db";
import type { TherapySession, Patient } from "@prisma/client";

export type SessionWithPatient = TherapySession & { patient: Patient };

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export async function listSessionsOnDate(
  userId: string,
  date: Date,
): Promise<SessionWithPatient[]> {
  return prisma.therapySession.findMany({
    where: { userId, startsAt: { gte: startOfDay(date), lte: endOfDay(date) } },
    include: { patient: true },
    orderBy: { startsAt: "asc" },
  });
}

export async function listSessionsInRange(
  userId: string,
  from: Date,
  to: Date,
): Promise<SessionWithPatient[]> {
  return prisma.therapySession.findMany({
    where: { userId, startsAt: { gte: from, lt: to } },
    include: { patient: true },
    orderBy: { startsAt: "asc" },
  });
}

export async function listSessionsForPatient(
  userId: string,
  patientId: string,
): Promise<TherapySession[]> {
  return prisma.therapySession.findMany({
    where: { userId, patientId },
    orderBy: { startsAt: "desc" },
  });
}

export async function getSession(
  userId: string,
  id: string,
): Promise<SessionWithPatient | null> {
  return prisma.therapySession.findFirst({
    where: { id, userId },
    include: { patient: true },
  });
}
