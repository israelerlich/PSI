import { z } from "zod";

export const createNoteSchema = z.object({
  patientId: z.string().min(1),
  sessionId: z.string().min(1).optional(),
  body: z.string().trim().min(1, "Anotação vazia").max(5000),
});
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
