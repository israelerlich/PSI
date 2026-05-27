"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/lib/validators/auth";
import {
  actionError,
  actionOk,
  fromZodError,
  type ActionResult,
} from "@/lib/action-result";

export async function changePasswordForUser(
  userId: string,
  input: ChangePasswordInput,
): Promise<ActionResult<void>> {
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  const u = await prisma.user.findUnique({ where: { id: userId } });
  if (!u) return actionError("Conta não encontrada.");
  if (!(await verifyPassword(parsed.data.currentPassword, u.passwordHash))) {
    return actionError("Senha atual incorreta.");
  }
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(parsed.data.newPassword) },
  });
  return actionOk(undefined);
}

export async function changePassword(
  input: ChangePasswordInput,
): Promise<ActionResult<void>> {
  const user = await requireUser();
  return changePasswordForUser(user.id, input);
}
