import { describe, expect, test } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("password", () => {
  test("hashes a password and verifies it", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    expect(hash).not.toBe("correct-horse-battery-staple");
    expect(hash).toMatch(/^\$2[aby]?\$/);
    expect(await verifyPassword("correct-horse-battery-staple", hash)).toBe(true);
  });

  test("returns false for wrong password", async () => {
    const hash = await hashPassword("right");
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  test("hashes the same input differently each call (salt)", async () => {
    const a = await hashPassword("same");
    const b = await hashPassword("same");
    expect(a).not.toBe(b);
  });
});
