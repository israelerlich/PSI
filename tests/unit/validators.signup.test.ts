import { describe, expect, test } from "vitest";
import { signupSchema } from "@/lib/validators/auth";

describe("signupSchema", () => {
  const valid = {
    name: "Marina",
    crp: "CRP 06/123456",
    email: "Marina@Teste.local",
    password: "Senha123!",
    confirmPassword: "Senha123!",
  };

  test("accepts valid input and lowercases email", () => {
    const r = signupSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("marina@teste.local");
  });

  test("rejects short name", () => {
    const r = signupSchema.safeParse({ ...valid, name: "X" });
    expect(r.success).toBe(false);
  });

  test("rejects invalid email", () => {
    const r = signupSchema.safeParse({ ...valid, email: "bad" });
    expect(r.success).toBe(false);
  });

  test("rejects password without uppercase", () => {
    const r = signupSchema.safeParse({
      ...valid,
      password: "senha123!",
      confirmPassword: "senha123!",
    });
    expect(r.success).toBe(false);
  });

  test("rejects password without number", () => {
    const r = signupSchema.safeParse({
      ...valid,
      password: "Senhaaaa!",
      confirmPassword: "Senhaaaa!",
    });
    expect(r.success).toBe(false);
  });

  test("rejects mismatched confirmation", () => {
    const r = signupSchema.safeParse({
      ...valid,
      confirmPassword: "Outra123!",
    });
    expect(r.success).toBe(false);
  });
});
