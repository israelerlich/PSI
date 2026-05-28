"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signupAction } from "@/server/actions/auth/signup";

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    const fd = new FormData(e.currentTarget);
    const input = {
      name: String(fd.get("name") ?? "").trim(),
      crp: String(fd.get("crp") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim(),
      password: String(fd.get("password") ?? ""),
      confirmPassword: String(fd.get("confirmPassword") ?? ""),
    };
    start(async () => {
      const r = await signupAction(input);
      if (!r.ok) {
        setError(r.error);
        setFieldErrors(r.fieldErrors ?? {});
        return;
      }
      router.replace("/");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="card p-6 space-y-4">
      <div>
        <label htmlFor="name" className="label-strong block mb-1">
          Nome completo
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          className="input"
          aria-invalid={!!fieldErrors.name}
        />
        {fieldErrors.name ? (
          <p className="mt-1 text-[12px] text-[var(--danger)]">
            {fieldErrors.name[0]}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="crp" className="label-strong block mb-1">
          CRP
        </label>
        <input
          id="crp"
          name="crp"
          type="text"
          required
          placeholder="CRP 06/123456"
          className="input"
          aria-invalid={!!fieldErrors.crp}
        />
        {fieldErrors.crp ? (
          <p className="mt-1 text-[12px] text-[var(--danger)]">
            {fieldErrors.crp[0]}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="email" className="label-strong block mb-1">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="input"
          aria-invalid={!!fieldErrors.email}
        />
        {fieldErrors.email ? (
          <p className="mt-1 text-[12px] text-[var(--danger)]">
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
          required
          minLength={8}
          autoComplete="new-password"
          className="input"
          aria-invalid={!!fieldErrors.password}
          aria-describedby="password-hint"
        />
        <p
          id="password-hint"
          className="mt-1 text-[11.5px] text-[var(--ink-4)]"
        >
          Mínimo 8 caracteres com 1 maiúscula, 1 minúscula e 1 número.
        </p>
        {fieldErrors.password ? (
          <p className="mt-1 text-[12px] text-[var(--danger)]">
            {fieldErrors.password[0]}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="label-strong block mb-1">
          Confirmar senha
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="input"
          aria-invalid={!!fieldErrors.confirmPassword}
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
        {pending ? "Criando conta..." : "Criar conta"}
      </button>

      <div className="pt-2 text-center text-[12.5px]">
        <Link href="/login" className="text-[var(--blue)] hover:underline">
          Já tenho uma conta · entrar
        </Link>
      </div>
    </form>
  );
}
