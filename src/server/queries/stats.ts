import { prisma } from "@/lib/db";

export type TodayStats = {
  todaySessionsCount: number;
  confirmedToday: number;
  activePatients: number;
  pendingPayments: number;
  pendingRecords: number;
  attendanceRate: number;
};

export async function getTodayStats(
  userId: string,
  today: Date = new Date(),
): Promise<TodayStats> {
  const dayStart = new Date(today);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(today);
  dayEnd.setHours(23, 59, 59, 999);

  const [
    todaySessionsCount,
    confirmedToday,
    activePatients,
    pendingPayments,
    pendingRecords,
    concluded,
    present,
  ] = await Promise.all([
    prisma.therapySession.count({
      where: { userId, startsAt: { gte: dayStart, lte: dayEnd } },
    }),
    prisma.therapySession.count({
      where: {
        userId,
        startsAt: { gte: dayStart, lte: dayEnd },
        confirmationStatus: "confirmed",
      },
    }),
    prisma.patient.count({ where: { userId, archived: false } }),
    prisma.billingEntry.count({
      where: { userId, paymentStatus: "PENDENTE" },
    }),
    prisma.therapySession.count({
      where: {
        userId,
        status: "CONCLUIDA",
        documentationStatus: { not: "complete" },
      },
    }),
    prisma.therapySession.count({ where: { userId, status: "CONCLUIDA" } }),
    prisma.therapySession.count({
      where: { userId, attendanceStatus: "present" },
    }),
  ]);

  const attendanceRate =
    concluded === 0 ? 0 : Math.round((present / concluded) * 100);

  return {
    todaySessionsCount,
    confirmedToday,
    activePatients,
    pendingPayments,
    pendingRecords,
    attendanceRate,
  };
}
