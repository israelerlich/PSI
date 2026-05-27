import { describe, expect, test } from "vitest";
import { createPatientSchema } from "@/lib/validators/patient";
import { createSessionSchema } from "@/lib/validators/session";
import { createRecordSchema } from "@/lib/validators/record";
import { createNoteSchema } from "@/lib/validators/note";
import { markPaidSchema } from "@/lib/validators/billing";
import { updateProfileSchema } from "@/lib/validators/settings";

describe("createPatientSchema", () => {
  test("name is required and >= 2 chars", () => {
    expect(
      createPatientSchema.safeParse({ name: "X", modality: "online" }).success,
    ).toBe(false);
    expect(
      createPatientSchema.safeParse({ name: "Ana", modality: "online" }).success,
    ).toBe(true);
  });
  test("modality must be online or presencial", () => {
    expect(
      createPatientSchema.safeParse({
        name: "Ana",
        modality: "x" as unknown as "online",
      }).success,
    ).toBe(false);
  });
  test("optional fields accept empty string and turn into undefined", () => {
    const r = createPatientSchema.safeParse({
      name: "Ana",
      modality: "online",
      email: "",
      whatsapp: "",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.email).toBeUndefined();
      expect(r.data.whatsapp).toBeUndefined();
    }
  });
});

describe("createSessionSchema", () => {
  test("rejects endsAt <= startsAt", () => {
    const r = createSessionSchema.safeParse({
      patientId: "p1",
      startsAt: "2026-05-20T10:00:00-03:00",
      endsAt: "2026-05-20T10:00:00-03:00",
      modality: "online",
      location: "Link",
      serviceType: "Psicoterapia",
      amountCents: 20000,
    });
    expect(r.success).toBe(false);
  });
  test("accepts valid input", () => {
    const r = createSessionSchema.safeParse({
      patientId: "p1",
      startsAt: "2026-05-20T10:00:00-03:00",
      endsAt: "2026-05-20T10:50:00-03:00",
      modality: "online",
      location: "Link de videochamada",
      serviceType: "Psicoterapia",
      amountCents: 20000,
    });
    expect(r.success).toBe(true);
  });
});

describe("createRecordSchema", () => {
  test("DAP requires D, A, P fields", () => {
    const r = createRecordSchema.safeParse({
      patientId: "p1",
      template: "DAP",
      fields: [
        { label: "Dado", value: "x" },
        { label: "Avaliação", value: "y" },
        { label: "Plano", value: "z" },
      ],
    });
    expect(r.success).toBe(true);
    const bad = createRecordSchema.safeParse({
      patientId: "p1",
      template: "DAP",
      fields: [{ label: "Dado", value: "x" }],
    });
    expect(bad.success).toBe(false);
  });
});

describe("createNoteSchema", () => {
  test("body required and non-empty", () => {
    expect(
      createNoteSchema.safeParse({ patientId: "p1", body: "" }).success,
    ).toBe(false);
    expect(
      createNoteSchema.safeParse({ patientId: "p1", body: "Algo" }).success,
    ).toBe(true);
  });
});

describe("markPaidSchema", () => {
  test("accepts a billing entry id", () => {
    expect(markPaidSchema.safeParse({ billingId: "b1" }).success).toBe(true);
  });
});

describe("updateProfileSchema", () => {
  test("requires name and CRP", () => {
    expect(updateProfileSchema.safeParse({ name: "", crp: "" }).success).toBe(
      false,
    );
    expect(
      updateProfileSchema.safeParse({ name: "Marina", crp: "CRP 06/123" })
        .success,
    ).toBe(true);
  });
});
