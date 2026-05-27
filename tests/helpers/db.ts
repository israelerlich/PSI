import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL_TEST) {
  throw new Error(
    "DATABASE_URL_TEST must be set for integration tests. " +
      "Did you copy .env.example to .env and start the test DB? " +
      "Run: npm run db:test:up && DATABASE_URL=$DATABASE_URL_TEST npx prisma migrate deploy",
  );
}

export const testPrisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL_TEST } },
});

/**
 * Removes all rows from all domain tables.
 * Must be called in beforeEach of integration tests.
 */
export async function resetDb(): Promise<void> {
  await testPrisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "PasswordResetToken",
      "AuthSession",
      "TimelineItem",
      "BillingEntry",
      "ClinicalAttachment",
      "Consent",
      "Note",
      "ClinicalRecord",
      "TherapySession",
      "Patient",
      "User"
    RESTART IDENTITY CASCADE;
  `);
}
