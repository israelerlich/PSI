import { describe, expect, test } from "vitest";
import {
  loginSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "@/lib/validators/auth";

describe("loginSchema", () => {
  test("accepts valid input", () => {
    expect(
      loginSchema.safeParse({ email: "a@b.com", password: "abc12345" }).success,
    ).toBe(true);
  });
  test("rejects invalid email", () => {
    const r = loginSchema.safeParse({
      email: "not-an-email",
      password: "abc12345",
    });
    expect(r.success).toBe(false);
  });
  test("rejects short password", () => {
    const r = loginSchema.safeParse({ email: "a@b.com", password: "abc" });
    expect(r.success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  test("requires confirmation to match", () => {
    const ok = resetPasswordSchema.safeParse({
      token: "x".repeat(64),
      password: "Abcdef12!",
      confirmPassword: "Abcdef12!",
    });
    expect(ok.success).toBe(true);
    const bad = resetPasswordSchema.safeParse({
      token: "x".repeat(64),
      password: "Abcdef12!",
      confirmPassword: "different!",
    });
    expect(bad.success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  test("rejects same current and new", () => {
    const r = changePasswordSchema.safeParse({
      currentPassword: "Abcdef12!",
      newPassword: "Abcdef12!",
      confirmPassword: "Abcdef12!",
    });
    expect(r.success).toBe(false);
  });
});
