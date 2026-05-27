"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { markAttendanceSchema } from "@/lib/validators/session";
import {
  actionError,
  actionOk,
  fromZodError,
  type ActionResult,
} from "@/lib/action-result";
import { revalidatePath } from "next/cache";
import type { TherapySession, SessionStatus } from "@prisma/client";

const statusFor: Record<"present" | "missed" | "excused", SessionStatus> = {
  present: "CONCLUIDA",
  missed: "NAO_COMPARECEU",
  excused: "CANCELADA",
};

export async function markAttendanceForUser(
  userId: string,
  input: unknown,
): Promise<ActionResult<TherapySession>> {
  const parsed = markAttendanceSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  const owns = await prisma.therapySession.findFirst({
    where: { id: parsed.data.id, userId },
  });
  if (!owns) return actionError("Sessão não encontrada.");
  const updated = await prisma.therapySession.update({
    where: { id: parsed.data.id },
    data: {
      attendanceStatus: parsed.data.attendanceStatus,
      status: statusFor[parsed.data.attendanceStatus],
    },
  });
  return actionOk(updated);
}

export async function markAttendance(
  input: unknown,
): Promise<ActionResult<TherapySession>> {
  const user = await requireUser();
  const r = await markAttendanceForUser(user.id, input);
  if (r.ok) {
    revalidatePath("/agenda");
    revalidatePath("/");
  }
  return r;
}
