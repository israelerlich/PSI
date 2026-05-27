"use server";

import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/validators/auth";
import {
  actionError,
  actionOk,
  fromZodError,
  type ActionResult,
} from "@/lib/action-result";

function hashToken(t: string) {
  return crypto.createHash("sha256").update(t).digest("hex");
}

export async function resetPassword(
  input: ResetPasswordInput,
): Promise<ActionResult<void>> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);

  const record = await prisma.passwordResetToken.findUnique({
    where: { token: hashToken(parsed.data.token) },
  });
  if (!record) return actionError("Link inválido.");
  if (record.usedAt) return actionError("Link já utilizado.");
  if (record.expiresAt < new Date()) return actionError("Link expirado.");

  const hash = await hashPassword(parsed.data.password);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: hash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.authSession.deleteMany({ where: { userId: record.userId } }),
  ]);
  return actionOk(undefined);
}
