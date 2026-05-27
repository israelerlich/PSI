import { z } from "zod";

export const createSessionSchema = z
  .object({
    patientId: z.string().min(1),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    modality: z.enum(["online", "presencial"]),
    location: z.string().min(1, "Informe local ou link"),
    serviceType: z.string().min(1).default("Psicoterapia individual"),
    amountCents: z.number().int().nonnegative(),
    notes: z.string().max(2000).optional(),
  })
  .refine((d) => d.endsAt > d.startsAt, {
    message: "Horário final deve ser após o início",
    path: ["endsAt"],
  });
export type CreateSessionInput = z.infer<typeof createSessionSchema>;

export const updateSessionSchema = z.object({
  id: z.string().min(1),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  location: z.string().min(1).optional(),
  serviceType: z.string().min(1).optional(),
  amountCents: z.number().int().nonnegative().optional(),
  notes: z.string().max(2000).optional(),
});

export const confirmSessionSchema = z.object({ id: z.string().min(1) });

export const markAttendanceSchema = z.object({
  id: z.string().min(1),
  attendanceStatus: z.enum(["present", "missed", "excused"]),
});

export const cancelSessionSchema = z.object({
  id: z.string().min(1),
  reason: z.string().max(500).optional(),
});
