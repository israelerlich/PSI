// Re-export Prisma types so legacy imports `@/lib/domain` keep working.
// Prefer importing directly from `@prisma/client` in new code.
export type {
  User,
  Patient,
  TherapySession,
  ClinicalRecord,
  Note,
  Consent,
  ClinicalAttachment,
  BillingEntry,
  TimelineItem,
  AuthSession,
  PasswordResetToken,
} from "@prisma/client";
