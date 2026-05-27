"use server";

import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import {
  requestResetSchema,
  type RequestResetInput,
} from "@/lib/validators/auth";
import {
  actionOk,
  fromZodError,
  type ActionResult,
} from "@/lib/action-result";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function requestPasswordReset(
  input: RequestResetInput,
): Promise<ActionResult<void>> {
  const parsed = requestResetSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (!user) return actionOk(undefined); // no enumeration

  const raw = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1h

  await prisma.passwordResetToken.create({
    data: { userId: user.id, token: hashToken(raw), expiresAt: expires },
  });

  const url = `${process.env.AUTH_URL ?? "http://localhost:3000"}/redefinir-senha?token=${raw}`;
  await sendEmail({
    to: user.email,
    subject: "Redefinir senha — Clínica IA",
    html: `
      <p>Olá ${user.name.split(" ")[0]},</p>
      <p>Use o link abaixo para definir uma nova senha. Ele expira em 1 hora.</p>
      <p><a href="${url}">${url}</a></p>
      <p>Se você não pediu isso, ignore este email.</p>
    `,
  });

  return actionOk(undefined);
}
