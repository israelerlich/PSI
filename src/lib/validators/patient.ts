import { z } from "zod";

const emptyToUndef = z.literal("").transform(() => undefined);

export const createPatientSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(120),
  email: z.union([z.string().email("Email inválido"), emptyToUndef]).optional(),
  whatsapp: z
    .union([
      z.string().regex(/^\+?\d{10,15}$/, "WhatsApp inválido"),
      emptyToUndef,
    ])
    .optional(),
  birthDate: z.coerce.date().optional(),
  modality: z.enum(["online", "presencial"]),
  generalNotes: z.string().max(2000).optional(),
});
export type CreatePatientInput = z.infer<typeof createPatientSchema>;

export const updatePatientSchema = createPatientSchema.partial().extend({
  id: z.string().min(1),
});
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;

export const archivePatientSchema = z.object({
  id: z.string().min(1),
  archived: z.boolean(),
});
