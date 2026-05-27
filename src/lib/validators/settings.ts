import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(120),
  crp: z.string().trim().min(3, "CRP inválido").max(40),
  city: z.string().max(80).optional(),
  phone: z.string().max(20).optional(),
  defaultSessionPriceCents: z.number().int().nonnegative().optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
