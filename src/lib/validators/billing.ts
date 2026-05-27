import { z } from "zod";

export const markPaidSchema = z.object({
  billingId: z.string().min(1),
});

export const generateReceiptSchema = z.object({
  billingId: z.string().min(1),
});
