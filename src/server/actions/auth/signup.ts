"use server";

import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { signupSchema, type SignupInput } from "@/lib/validators/auth";
import {
  actionError,
  actionOk,
  fromZodError,
  type ActionResult,
} from "@/lib/action-result";

/**
 * Pure function used by tests (no session side effects).
 * Creates a User row with hashed password.
 */
export async function signupForInput(
  input: SignupInput,
): Promise<ActionResult<{ userId: string; email: string }>> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);

  const { name, crp, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return actionError("Já existe uma conta com esse email.", {
      email: ["Email já cadastrado"],
    });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, crp, email, passwordHash },
  });

  return actionOk({ userId: user.id, email: user.email });
}

/**
 * Server Action consumed by the /cadastro form. Creates the account and
 * issues a session cookie via Auth.js signIn.
 */
export async function signupAction(
  input: SignupInput,
): Promise<ActionResult<{ email: string }>> {
  const created = await signupForInput(input);
  if (!created.ok) return created;

  // Auto-login after signup
  try {
    const { signIn } = await import("@/lib/auth");
    await signIn("credentials", {
      email: input.email,
      password: input.password,
      redirect: false,
    });
  } catch {
    // Tests don't have HTTP context — that's fine, account is created.
  }

  return actionOk({ email: created.data.email });
}
