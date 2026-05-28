import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL_TEST) {
  throw new Error(
    "DATABASE_URL_TEST must be set for integration tests. " +
      "Did you copy .env.example to .env and start the test DB? " +
      "Run: npm run db:test:up && DATABASE_URL=$DATABASE_URL_TEST npx prisma migrate deploy",
  );
}

// SAFETY: refuse to run integration tests against the dev database.
// resetDb() TRUNCATES every table — pointing at the dev DB wipes real data.
const TEST_URL = process.env.DATABASE_URL_TEST;
if (/\/clinica_ia(\?|$)/.test(TEST_URL)) {
  throw new Error(
    `Refusing to run integration tests against the dev database (${TEST_URL}). ` +
      `Use a separate database. Quickest fix: create it once on the embedded ` +
      `Postgres with:\n` +
      `  psql "postgresql://psi:psi@localhost:5432/postgres" -c 'CREATE DATABASE clinica_ia_test;'\n` +
      `Then set DATABASE_URL_TEST=postgresql://psi:psi@localhost:5432/clinica_ia_test and rerun migrations.`,
  );
}

export const testPrisma = new PrismaClient({
  datasources: { db: { url: TEST_URL } },
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
