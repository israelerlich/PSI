"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import {
  actionError,
  actionOk,
  fromZodError,
  type ActionResult,
} from "@/lib/action-result";
import { revalidatePath } from "next/cache";
import type { TherapySession, SessionStatus } from "@prisma/client";
// Subset of createRecordSchema (omits patientId/sessionId — added from session row)
const recordFieldsSchema = z.object({
  label: z.string().min(1),
  value: z.string(),
});
const recordSubsetSchema = z.discriminatedUnion("template", [
  z.object({
    template: z.literal("DAP"),
    fields: z.array(recordFieldsSchema).min(3),
    contextSummary: z.string().max(2000).optional(),
  }),
  z.object({
    template: z.literal("BIRP"),
    fields: z.array(recordFieldsSchema).min(4),
    contextSummary: z.string().max(2000).optional(),
  }),
]);

const schema = z.object({
  sessionId: z.string().min(1),
  attendanceStatus: z.enum(["present", "missed", "excused"]),
  markPaid: z.boolean().optional(),
  note: z.string().max(5000).optional(),
  record: recordSubsetSchema.optional(),
});
export type SaveAttendanceInput = z.infer<typeof schema>;

const statusFor: Record<"present" | "missed" | "excused", SessionStatus> = {
  present: "CONCLUIDA",
  missed: "NAO_COMPARECEU",
  excused: "CANCELADA",
};

export async function saveAttendanceForUser(
  userId: string,
  input: unknown,
): Promise<ActionResult<TherapySession>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  const data = parsed.data;
  const owns = await prisma.therapySession.findFirst({
    where: { id: data.sessionId, userId },
  });
  if (!owns) return actionError("Sessão não encontrada.");

  const updated = await prisma.$transaction(async (tx) => {
    const session = await tx.therapySession.update({
      where: { id: data.sessionId },
      data: {
        attendanceStatus: data.attendanceStatus,
        status: statusFor[data.attendanceStatus],
        documentationStatus: data.record ? "complete" : owns.documentationStatus,
      },
    });

    if (data.record) {
      const retention = new Date();
      retention.setFullYear(retention.getFullYear() + 5);
      await tx.clinicalRecord.upsert({
        where: { sessionId: data.sessionId },
        update: {
          fields: data.record.fields,
          contextSummary: data.record.contextSummary,
        },
        create: {
          userId,
          patientId: owns.patientId,
          sessionId: data.sessionId,
          template: data.record.template,
          fields: data.record.fields,
          contextSummary: data.record.contextSummary,
          retentionUntil: retention,
        },
      });
    }

    if (data.note) {
      await tx.note.create({
        data: {
          userId,
          patientId: owns.patientId,
          sessionId: data.sessionId,
          body: data.note,
        },
      });
    }

    if (data.markPaid) {
      await tx.billingEntry.updateMany({
        where: { sessionId: data.sessionId },
        data: { paymentStatus: "PAGO", paidAt: new Date() },
      });
      await tx.therapySession.update({
        where: { id: data.sessionId },
        data: { paymentStatus: "PAGO" },
      });
    }

    return session;
  });

  return actionOk(updated);
}

export async function saveAttendance(
  input: SaveAttendanceInput,
): Promise<ActionResult<TherapySession>> {
  const user = await requireUser();
  const r = await saveAttendanceForUser(user.id, input);
  if (r.ok) {
    revalidatePath("/agenda");
    revalidatePath("/");
    revalidatePath(`/agenda/${input.sessionId}`);
  }
  return r;
}
