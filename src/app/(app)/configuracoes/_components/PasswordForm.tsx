"use client";

import { useState, useTransition } from "react";
import { changePassword } from "@/server/actions/settings/changePassword";

export function PasswordForm() {
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [topError, setTopError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setTopError(null);
    setOk(false);
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const r = await changePassword({
        currentPassword: String(fd.get("currentPassword") ?? ""),
        newPassword: String(fd.get("newPassword") ?? ""),
        confirmPassword: String(fd.get("confirmPassword") ?? ""),
      });
      if (r.ok) {
        setOk(true);
        (e.target as HTMLFormElement).reset();
      } else {
        setErrors(r.fieldErrors ?? {});
        setTopError(r.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field
        label="Senha atual"
        name="currentPassword"
        err={errors.currentPassword?.[0]}
      />
      <Field
        label="Nova senha"
        name="newPassword"
        err={errors.newPassword?.[0]}
      />
      <Field
        label="Confirmar"
        name="confirmPassword"
        err={errors.confirmPassword?.[0]}
      />
      {topError ? (
        <p className="text-[13px] text-[var(--danger-text)]">{topError}</p>
      ) : null}
      {ok ? (
        <p className="text-[13px] text-[var(--success-text)]">
          Senha atualizada.
        </p>
      ) : null}
      <div className="flex justify-end">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Salvando..." : "Trocar senha"}
        </button>
      </div>
    </form>
  );
}

function Field(props: { label: string; name: string; err?: string }) {
  return (
    <div>
      <label htmlFor={props.name} className="label-strong block mb-1">
        {props.label}
      </label>
      <input
        id={props.name}
        name={props.name}
        type="password"
        required
        minLength={8}
        className="input"
      />
      {props.err ? (
        <p className="mt-1 text-[12px] text-[var(--danger)]">{props.err}</p>
      ) : null}
    </div>
  );
}
