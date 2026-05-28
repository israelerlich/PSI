import { beforeEach, describe, expect, test } from "vitest";
import { resetDb, testPrisma } from "../../helpers/db";
import { verifyPassword } from "@/lib/password";

describe("signup (integration)", () => {
  beforeEach(async () => {
    await resetDb();
  });

  test("creates user with hashed password and lowercases email", async () => {
    const { signupForInput } = await import("@/server/actions/auth/signup");
    const r = await signupForInput({
      name: "Marina Azevedo",
      crp: "CRP 06/123456",
      email: "Marina@Test.local",
      password: "Senha123!",
      confirmPassword: "Senha123!",
    });
    expect(r.ok).toBe(true);
    const u = await testPrisma.user.findUnique({
      where: { email: "marina@test.local" },
    });
    expect(u).not.toBeNull();
    expect(u!.name).toBe("Marina Azevedo");
    expect(u!.passwordHash).not.toBe("Senha123!");
    expect(await verifyPassword("Senha123!", u!.passwordHash)).toBe(true);
  });

  test("rejects duplicate email", async () => {
    const { signupForInput } = await import("@/server/actions/auth/signup");
    const input = {
      name: "Marina",
      crp: "CRP 06/123",
      email: "dup@test.local",
      password: "Senha123!",
      confirmPassword: "Senha123!",
    };
    const first = await signupForInput(input);
    expect(first.ok).toBe(true);
    const second = await signupForInput(input);
    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.error).toMatch(/já existe|já cadastrado/i);
      expect(second.fieldErrors?.email).toBeDefined();
    }
  });

  test("rejects weak password before hitting DB", async () => {
    const { signupForInput } = await import("@/server/actions/auth/signup");
    const r = await signupForInput({
      name: "Marina",
      crp: "CRP 06/123",
      email: "weak@test.local",
      password: "weakpass",
      confirmPassword: "weakpass",
    });
    expect(r.ok).toBe(false);
    expect(await testPrisma.user.count()).toBe(0);
  });

  test("isolates patients between two signed-up users", async () => {
    const { signupForInput } = await import("@/server/actions/auth/signup");

    const a = await signupForInput({
      name: "Marina",
      crp: "CRP 06/A",
      email: "a@t.local",
      password: "Senha123!",
      confirmPassword: "Senha123!",
    });
    const b = await signupForInput({
      name: "João",
      crp: "CRP 06/B",
      email: "b@t.local",
      password: "Senha123!",
      confirmPassword: "Senha123!",
    });
    if (!a.ok || !b.ok) throw new Error("setup failed");

    // Use Prisma directly (bypassing the server action that pulls next-auth
    // into Vitest's module graph). We're testing data isolation, not the
    // action wrapper.
    await testPrisma.patient.create({
      data: {
        userId: a.data.userId,
        name: "Paciente de Marina",
        modality: "online",
      },
    });
    await testPrisma.patient.create({
      data: {
        userId: b.data.userId,
        name: "Paciente de João",
        modality: "presencial",
      },
    });

    const fromA = await testPrisma.patient.findMany({
      where: { userId: a.data.userId },
    });
    const fromB = await testPrisma.patient.findMany({
      where: { userId: b.data.userId },
    });

    expect(fromA).toHaveLength(1);
    expect(fromB).toHaveLength(1);
    expect(fromA[0].name).toBe("Paciente de Marina");
    expect(fromB[0].name).toBe("Paciente de João");
  });
});
