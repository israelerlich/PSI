"use server";

import { signOut } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function logoutAction(): Promise<never> {
  await signOut({ redirect: false });
  redirect("/login");
}
