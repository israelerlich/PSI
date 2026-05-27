"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword } from "@/server/actions/auth/resetPassword";

export function ResetForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const token = sp.get("token") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") ?? "");
    const confirmPassword = String(fd.get("confirmPassword") ?? "");
    start(async () => {
      const r = await resetPassword({ token, password, confirmPassword });
      if (r.ok) router.replace("/login?reset=ok");
      else {
        setError(r.error);
        setFieldErrors(r.fieldErrors ?? {});
      }
    });
  }

  if (!token) {
    return (
      <div className="card p-6 text-[13px] text-[var(--danger-text)]">
        Link inválido. Solicite um novo em /esqueci-senha.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card p-6 space-y-4">
      <div>
        <label htmlFor="password" className="label-strong block mb-1">
          Nova senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className="input"
        />
        {fieldErrors.password ? (
          <p className="mt-1 text-[12px] text-[var(--danger)]">
            {fieldErrors.password[0]}
          </p>
        ) : null}
      </div>
      <div>
        <label htmlFor="confirmPassword" className="label-strong block mb-1">
          Confirmar
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          className="input"
        />
        {fieldErrors.confirmPassword ? (
          <p className="mt-1 text-[12px] text-[var(--danger)]">
            {fieldErrors.confirmPassword[0]}
          </p>
        ) : null}
      </div>
      {error ? (
        <div
          role="alert"
          className="rounded-md border border-[#f3bcbc] bg-[var(--danger-soft)] p-3 text-[13px] text-[var(--danger-text)]"
        >
          {error}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary w-full"
      >
        {pending ? "Salvando..." : "Definir nova senha"}
      </button>
    </form>
  );
}
