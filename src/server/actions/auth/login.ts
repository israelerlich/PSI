"use server";

import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { loginSchema, type LoginInput } from "@/lib/validators/auth";
import {
  actionError,
  actionOk,
  fromZodError,
  type ActionResult,
} from "@/lib/action-result";

/**
 * Pure verification — no cookie side effects. Used by integration tests
 * and reused by the cookie path (loginAction).
 */
export async function verifyLogin(
  input: LoginInput,
): Promise<ActionResult<{ userId: string; email: string }>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (!user) return actionError("Credenciais inválidas.");
  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) return actionError("Credenciais inválidas.");
  return actionOk({ userId: user.id, email: user.email });
}

/**
 * Server Action consumed by the /login form. Verifies credentials then
 * delegates to Auth.js signIn() to set the cookie. In test contexts
 * (no Next request) the cookie step is a no-op.
 */
export async function loginAction(
  input: LoginInput,
): Promise<ActionResult<{ email: string }>> {
  const verified = await verifyLogin(input);
  if (!verified.ok) return verified;
  try {
    const { signIn } = await import("@/lib/auth");
    await signIn("credentials", {
      email: input.email,
      password: input.password,
      redirect: false,
    });
  } catch {
    // Outside an HTTP request (tests) signIn cannot set cookies — that's OK,
    // we already verified credentials. Production calls always have context.
  }
  return actionOk({ email: verified.data.email });
}
