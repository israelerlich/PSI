"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/lib/validators/settings";
import {
  actionOk,
  fromZodError,
  type ActionResult,
} from "@/lib/action-result";
import { revalidatePath } from "next/cache";
import type { User } from "@prisma/client";

export async function updateProfileForUser(
  userId: string,
  input: UpdateProfileInput,
): Promise<ActionResult<User>> {
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  const u = await prisma.user.update({
    where: { id: userId },
    data: parsed.data,
  });
  return actionOk(u);
}

export async function updateProfile(
  input: UpdateProfileInput,
): Promise<ActionResult<User>> {
  const user = await requireUser();
  const r = await updateProfileForUser(user.id, input);
  if (r.ok) revalidatePath("/configuracoes");
  return r;
}
