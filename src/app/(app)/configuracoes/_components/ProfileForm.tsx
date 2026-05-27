"use client";

import { useState, useTransition } from "react";
import type { User } from "@prisma/client";
import { updateProfile } from "@/server/actions/settings/updateProfile";

export function ProfileForm({ user }: { user: User }) {
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [topError, setTopError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setTopError(null);
    const fd = new FormData(e.currentTarget);
    const amount = Number(fd.get("price") ?? user.defaultSessionPriceCents / 100);
    start(async () => {
      const r = await updateProfile({
        name: String(fd.get("name") ?? ""),
        crp: String(fd.get("crp") ?? ""),
        city: String(fd.get("city") ?? "") || undefined,
        phone: String(fd.get("phone") ?? "") || undefined,
        defaultSessionPriceCents: Math.round(amount * 100),
      });
      if (r.ok) setSavedAt(new Date());
      else {
        setErrors(r.fieldErrors ?? {});
        setTopError(r.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field
        label="Nome"
        name="name"
        defaultValue={user.name}
        required
        err={errors.name?.[0]}
      />
      <Field
        label="CRP"
        name="crp"
        defaultValue={user.crp}
        required
        err={errors.crp?.[0]}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="Cidade"
          name="city"
          defaultValue={user.city ?? ""}
          err={errors.city?.[0]}
        />
        <Field
          label="Telefone"
          name="phone"
          defaultValue={user.phone ?? ""}
          err={errors.phone?.[0]}
        />
      </div>
      <Field
        label="Valor padrão da sessão (R$)"
        name="price"
        type="number"
        defaultValue={(user.defaultSessionPriceCents / 100).toFixed(2)}
        err={errors.defaultSessionPriceCents?.[0]}
      />
      {topError ? (
        <p className="text-[13px] text-[var(--danger-text)]">{topError}</p>
      ) : null}
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-[var(--ink-5)]">
          {savedAt ? `Salvo às ${savedAt.toLocaleTimeString("pt-BR")}` : ""}
        </span>
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}

function Field(props: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  err?: string;
}) {
  return (
    <div>
      <label htmlFor={props.name} className="label-strong block mb-1">
        {props.label}
      </label>
      <input
        id={props.name}
        name={props.name}
        type={props.type ?? "text"}
        defaultValue={props.defaultValue}
        required={props.required}
        className="input"
      />
      {props.err ? (
        <p className="mt-1 text-[12px] text-[var(--danger)]">{props.err}</p>
      ) : null}
    </div>
  );
}
