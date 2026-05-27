import { beforeEach, describe, expect, test } from "vitest";
import { resetDb, testPrisma } from "../helpers/db";

describe("integration smoke", () => {
  beforeEach(async () => {
    await resetDb();
  });

  test("connects and counts users (0 after reset)", async () => {
    const count = await testPrisma.user.count();
    expect(count).toBe(0);
  });
});
