import { z } from "zod";

const fieldSchema = z.object({
  label: z.string().min(1),
  value: z.string(),
});

const dapFields = z
  .array(fieldSchema)
  .min(3, "DAP exige 3 campos: Dado, Avaliação, Plano")
  .refine(
    (arr) =>
      arr.some((f) => /^dado/i.test(f.label)) &&
      arr.some((f) => /^avalia/i.test(f.label)) &&
      arr.some((f) => /^plano/i.test(f.label)),
    { message: "DAP precisa de Dado, Avaliação e Plano" },
  );

const birpFields = z
  .array(fieldSchema)
  .min(4, "BIRP exige 4 campos: Behavior, Intervention, Response, Plan")
  .refine(
    (arr) =>
      arr.some((f) => /behav/i.test(f.label)) &&
      arr.some((f) => /interv/i.test(f.label)) &&
      arr.some((f) => /respons|resposta/i.test(f.label)) &&
      arr.some((f) => /plan/i.test(f.label)),
    { message: "BIRP precisa de Behavior, Intervention, Response, Plan" },
  );

export const createRecordSchema = z.discriminatedUnion("template", [
  z.object({
    patientId: z.string().min(1),
    sessionId: z.string().min(1).optional(),
    template: z.literal("DAP"),
    fields: dapFields,
    contextSummary: z.string().max(2000).optional(),
  }),
  z.object({
    patientId: z.string().min(1),
    sessionId: z.string().min(1).optional(),
    template: z.literal("BIRP"),
    fields: birpFields,
    contextSummary: z.string().max(2000).optional(),
  }),
]);
export type CreateRecordInput = z.infer<typeof createRecordSchema>;

export const updateRecordSchema = z.object({
  id: z.string().min(1),
  fields: z.array(fieldSchema).min(1),
  contextSummary: z.string().max(2000).optional(),
});
