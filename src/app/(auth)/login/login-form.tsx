"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  loginFromForm,
  type LoginFormState,
} from "@/server/actions/auth/login";

const initialState: LoginFormState = { error: null, fieldErrors: null };

export function LoginForm() {
  const sp = useSearchParams();
  const next = sp.get("next") ?? "/";
  const resetOk = sp.get("reset") === "ok";
  const [state, formAction] = useActionState(loginFromForm, initialState);
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="card p-6 space-y-4">
      <input type="hidden" name="next" value={next} />

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
          <p
            id="password-err"
            className="mt-1 text-[12px] text-[var(--danger)]"
          >
            {fieldErrors.password[0]}
          </p>
        ) : null}
      </div>

      {state.error ? (
        <div
          role="alert"
          className="rounded-md border border-[#f3bcbc] bg-[var(--danger-soft)] p-3 text-[13px] text-[var(--danger-text)]"
        >
          {state.error}
        </div>
      ) : null}

      <SubmitButton />

      <div className="flex justify-between items-center pt-2 text-[12.5px]">
        <Link
          href="/esqueci-senha"
          className="text-[var(--blue)] hover:underline"
        >
          Esqueci minha senha
        </Link>
        <Link href="/cadastro" className="text-[var(--blue)] hover:underline">
          Criar conta
        </Link>
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary w-full">
      {pending ? "Entrando..." : "Entrar"}
    </button>
  );
}
