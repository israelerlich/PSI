"use client";

import { useState, useTransition } from "react";
import type { ActionResult } from "@/lib/action-result";
import type { CreatePatientInput } from "@/lib/validators/patient";

type Props = {
  defaultValues?: Partial<CreatePatientInput>;
  onSubmit: (input: CreatePatientInput) => Promise<ActionResult<unknown>>;
  onCancel?: () => void;
  submitLabel?: string;
};

export function PatientForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = "Salvar",
}: Props) {
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [topError, setTopError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setTopError(null);
    const fd = new FormData(e.currentTarget);
    const input: CreatePatientInput = {
      name: String(fd.get("name") ?? "").trim(),
      email: (String(fd.get("email") ?? "").trim() || undefined) as
        | string
        | undefined,
      whatsapp: (String(fd.get("whatsapp") ?? "").trim() || undefined) as
        | string
        | undefined,
      modality: String(fd.get("modality") ?? "online") as "online" | "presencial",
      generalNotes: String(fd.get("generalNotes") ?? "").trim() || undefined,
    };
    startTransition(async () => {
      const r = await onSubmit(input);
      if (!r.ok) {
        setErrors(r.fieldErrors ?? {});
        setTopError(r.error);
      }
    });
  }

  return (
    <form onSubmit={handle} className="space-y-4">
      <Field
        label="Nome"
        name="name"
        required
        defaultValue={defaultValues?.name}
        error={errors.name?.[0]}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="Email"
          name="email"
          type="email"
          defaultValue={defaultValues?.email}
          error={errors.email?.[0]}
        />
        <Field
          label="WhatsApp"
          name="whatsapp"
          placeholder="+5511999999999"
          defaultValue={defaultValues?.whatsapp}
          error={errors.whatsapp?.[0]}
        />
      </div>
      <SelectField
        label="Modalidade"
        name="modality"
        defaultValue={defaultValues?.modality ?? "online"}
        options={[
          { value: "online", label: "Online" },
          { value: "presencial", label: "Presencial" },
        ]}
        error={errors.modality?.[0]}
      />
      <TextArea
        label="Observações gerais"
        name="generalNotes"
        defaultValue={defaultValues?.generalNotes}
        error={errors.generalNotes?.[0]}
      />

      {topError ? (
        <div
          role="alert"
          className="rounded-md border border-[#f3bcbc] bg-[var(--danger-soft)] p-3 text-[13px] text-[var(--danger-text)]"
        >
          {topError}
        </div>
      ) : null}

      <div className="flex justify-end gap-2">
        {onCancel ? (
          <button type="button" onClick={onCancel} className="btn btn-ghost">
            Cancelar
          </button>
        ) : null}
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Salvando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field(props: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  error?: string;
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
        required={props.required}
        placeholder={props.placeholder}
        defaultValue={props.defaultValue}
        className="input"
        aria-invalid={!!props.error}
      />
      {props.error ? (
        <p className="mt-1 text-[12px] text-[var(--danger)]">{props.error}</p>
      ) : null}
    </div>
  );
}

function SelectField(props: {
  label: string;
  name: string;
  defaultValue: string;
  options: { value: string; label: string }[];
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={props.name} className="label-strong block mb-1">
        {props.label}
      </label>
      <select
        id={props.name}
        name={props.name}
        defaultValue={props.defaultValue}
        className="input"
      >
        {props.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {props.error ? (
        <p className="mt-1 text-[12px] text-[var(--danger)]">{props.error}</p>
      ) : null}
    </div>
  );
}

function TextArea(props: {
  label: string;
  name: string;
  defaultValue?: string;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={props.name} className="label-strong block mb-1">
        {props.label}
      </label>
      <textarea
        id={props.name}
        name={props.name}
        defaultValue={props.defaultValue}
        rows={3}
        className="input min-h-[88px] py-2 leading-snug"
      />
      {props.error ? (
        <p className="mt-1 text-[12px] text-[var(--danger)]">{props.error}</p>
      ) : null}
    </div>
  );
}
