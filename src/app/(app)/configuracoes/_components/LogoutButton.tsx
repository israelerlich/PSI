"use client";

import { useTransition } from "react";
import { logoutAction } from "@/server/actions/auth/logout";

export function LogoutButton() {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await logoutAction();
        })
      }
      className="btn btn-secondary"
    >
      {pending ? "Saindo..." : "Sair"}
    </button>
  );
}
