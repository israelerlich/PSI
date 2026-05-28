"use client";

import { useTransition, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginAction } from "@/server/actions/auth/login";

export function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const resetOk = sp.get("reset") === "ok";
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    const fd = new FormData(e.currentTarget);
    const input = {
      email: String(fd.get("email") ?? ""),
      password: String(fd.get("password") ?? ""),
    };
    startTransition(async () => {
      const r = await loginAction(input);
      if (!r.ok) {
        setError(r.error);
        setFieldErrors(r.fieldErrors ?? {});
        return;
      }
      router.replace(sp.get("next") ?? "/");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="card p-6 space-y-4">
      {resetOk ? (
        <div
          role="status"
          className="rounded-md border border-[#bfe3cf] bg-[var(--success-soft)] p-3 text-[13px] text-[var(--success-text)]"
        >
          Senha atualizada. Faça login com a nova senha.
        </div>
      ) : null}

      <div>
        <label htmlFor="email" className="label-strong block mb-1">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="input"
          aria-invalid={!!fieldErrors.email}
          aria-describedby={fieldErrors.email ? "email-err" : undefined}
        />
        {fieldErrors.email ? (
          <p id="email-err" className="mt-1 text-[12px] text-[var(--danger)]">
            {fieldErrors.email[0]}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="password" className="label-strong block mb-1">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
          aria-invalid={!!fieldErrors.password}
          aria-describedby={fieldErrors.password ? "password-err" : undefined}
        />
        {fieldErrors.password ? (
          <p id="password-err" className="mt-1 text-[12px] text-[var(--danger)]">
            {fieldErrors.password[0]}
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
        {pending ? "Entrando..." : "Entrar"}
      </button>

      <div className="flex justify-between items-center pt-2 text-[12.5px]">
        <Link
          href="/esqueci-senha"
          className="text-[var(--blue)] hover:underline"
        >
          Esqueci minha senha
        </Link>
        <Link
          href="/cadastro"
          className="text-[var(--blue)] hover:underline"
        >
          Criar conta
        </Link>
      </div>
    </form>
  );
}
