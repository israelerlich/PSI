import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { User } from "@prisma/client";

/**
 * Returns the full DB user for the current session, or redirects to /login.
 * Use inside Server Components, Server Actions, or Route Handlers.
 */
export async function requireUser(): Promise<User> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user) redirect("/login");
  return user;
}

/**
 * Returns the current user or null without redirecting. Useful in layouts
 * that render differently for anonymous vs. authenticated users.
 */
export async function getCurrentUser(): Promise<User | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}
