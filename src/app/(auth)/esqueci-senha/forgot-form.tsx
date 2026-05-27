"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/server/actions/auth/requestPasswordReset";

export function ForgotForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");
    start(async () => {
      const r = await requestPasswordReset({ email });
      if (r.ok) setSent(true);
      else setError(r.error);
    });
  }

  if (sent) {
    return (
      <div className="card p-6 space-y-3">
        <p className="text-[14px] text-[var(--ink-2)]">
          Se o email existir na nossa base, enviamos um link para redefinir a
          senha. Verifique sua caixa de entrada.
        </p>
        <Link
          href="/login"
          className="text-[13px] text-[var(--blue)] hover:underline"
        >
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card p-6 space-y-4">
      <p className="text-[13px] text-[var(--ink-3)]">
        Digite seu email. Você receberá um link para definir uma nova senha.
      </p>
      <div>
        <label htmlFor="email" className="label-strong block mb-1">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="input"
        />
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
        {pending ? "Enviando..." : "Enviar link"}
      </button>
      <div className="pt-2 text-center">
        <Link
          href="/login"
          className="text-[13px] text-[var(--blue)] hover:underline"
        >
          Voltar para o login
        </Link>
      </div>
    </form>
  );
}
