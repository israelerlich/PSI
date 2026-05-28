-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Modality" AS ENUM ('online', 'presencial');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('AGENDADA', 'REMANEJADA', 'CANCELADA', 'CONCLUIDA', 'NAO_COMPARECEU');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDENTE', 'PAGO');

-- CreateEnum
CREATE TYPE "ConfirmationStatus" AS ENUM ('pending', 'confirmed', 'rescheduled', 'manual_review');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('expected', 'present', 'missed', 'excused');

-- CreateEnum
CREATE TYPE "DocumentationStatus" AS ENUM ('not_started', 'draft', 'complete');

-- CreateEnum
CREATE TYPE "SessionOrigin" AS ENUM ('dashboard', 'imported');

-- CreateEnum
CREATE TYPE "RecordTemplate" AS ENUM ('DAP', 'BIRP');

-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('pending', 'complete', 'expired');

-- CreateEnum
CREATE TYPE "ConsentSignStatus" AS ENUM ('pending', 'signed', 'expired');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('not_required', 'ready', 'issued', 'failed');

-- CreateEnum
CREATE TYPE "ReceiptStatus" AS ENUM ('not_ready', 'ready', 'sent');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "crp" TEXT NOT NULL,
    "city" TEXT,
    "phone" TEXT,
    "defaultSessionPriceCents" INTEGER NOT NULL DEFAULT 20000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "whatsapp" TEXT,
    "birthDate" TIMESTAMP(3),
    "modality" "Modality" NOT NULL DEFAULT 'online',
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "generalNotes" TEXT,
    "consentStatus" "ConsentStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TherapySession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "modality" "Modality" NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'AGENDADA',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDENTE',
    "location" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL DEFAULT 'Psicoterapia individual',
    "documentationStatus" "DocumentationStatus" NOT NULL DEFAULT 'not_started',
    "confirmationStatus" "ConfirmationStatus" NOT NULL DEFAULT 'pending',
    "attendanceStatus" "AttendanceStatus" NOT NULL DEFAULT 'expected',
    "amountCents" INTEGER NOT NULL,
    "origin" "SessionOrigin" NOT NULL DEFAULT 'dashboard',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TherapySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "sessionId" TEXT,
    "template" "RecordTemplate" NOT NULL,
    "fields" JSONB NOT NULL,
    "contextSummary" TEXT,
    "retentionUntil" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "sessionId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "ConsentSignStatus" NOT NULL DEFAULT 'pending',
    "signedAt" TIMESTAMP(3),
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Consent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalAttachment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicalAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "sessionId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "serviceType" TEXT NOT NULL,
    "serviceDate" TIMESTAMP(3) NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDENTE',
    "paidAt" TIMESTAMP(3),
    "invoiceStatus" "InvoiceStatus" NOT NULL DEFAULT 'not_required',
    "receiptStatus" "ReceiptStatus" NOT NULL DEFAULT 'not_ready',
    "receiptUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelineItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "kind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimelineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthSession" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Patient_userId_idx" ON "Patient"("userId");

-- CreateIndex
CREATE INDEX "Patient_userId_archived_idx" ON "Patient"("userId", "archived");

-- CreateIndex
CREATE INDEX "TherapySession_userId_startsAt_idx" ON "TherapySession"("userId", "startsAt");

-- CreateIndex
CREATE INDEX "TherapySession_patientId_startsAt_idx" ON "TherapySession"("patientId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalRecord_sessionId_key" ON "ClinicalRecord"("sessionId");

-- CreateIndex
CREATE INDEX "ClinicalRecord_userId_patientId_idx" ON "ClinicalRecord"("userId", "patientId");

-- CreateIndex
CREATE INDEX "Note_userId_patientId_idx" ON "Note"("userId", "patientId");

-- CreateIndex
CREATE INDEX "Consent_userId_patientId_idx" ON "Consent"("userId", "patientId");

-- CreateIndex
CREATE INDEX "ClinicalAttachment_userId_patientId_idx" ON "ClinicalAttachment"("userId", "patientId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingEntry_sessionId_key" ON "BillingEntry"("sessionId");

-- CreateIndex
CREATE INDEX "BillingEntry_userId_paymentStatus_idx" ON "BillingEntry"("userId", "paymentStatus");

-- CreateIndex
CREATE INDEX "TimelineItem_userId_patientId_idx" ON "TimelineItem"("userId", "patientId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthSession_sessionToken_key" ON "AuthSession"("sessionToken");

-- CreateIndex
CREATE INDEX "AuthSession_userId_idx" ON "AuthSession"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TherapySession" ADD CONSTRAINT "TherapySession_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TherapySession" ADD CONSTRAINT "TherapySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalRecord" ADD CONSTRAINT "ClinicalRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalRecord" ADD CONSTRAINT "ClinicalRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalRecord" ADD CONSTRAINT "ClinicalRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TherapySession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalAttachment" ADD CONSTRAINT "ClinicalAttachment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalAttachment" ADD CONSTRAINT "ClinicalAttachment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingEntry" ADD CONSTRAINT "BillingEntry_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingEntry" ADD CONSTRAINT "BillingEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingEntry" ADD CONSTRAINT "BillingEntry_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TherapySession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineItem" ADD CONSTRAINT "TimelineItem_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineItem" ADD CONSTRAINT "TimelineItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- CHECK constraint: session must end after it starts
ALTER TABLE "TherapySession"
  ADD CONSTRAINT "TherapySession_ends_after_starts"
  CHECK ("endsAt" > "startsAt");
