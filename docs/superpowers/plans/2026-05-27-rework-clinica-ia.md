# Rework Clínica IA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refatorar Clínica IA para um painel de gestão clínica com autenticação real, persistência em PostgreSQL via Prisma, Server Actions testadas, e UX focada no dia a dia — removendo todas as features de WhatsApp/IA/automação/alertas.

**Architecture:** Next.js 16 App Router com dois grupos de rotas: `(auth)` para login/recuperação e `(app)` para tudo protegido pelo middleware. Dados em PostgreSQL via Prisma. Mutações por Server Actions com Zod + `requireUser()`. Leituras tipadas em `src/server/queries/`. Auth.js v5 com Credentials provider e sessão em DB. Testes em três camadas (unit, integração de Server Actions em Postgres real, componentes críticos).

**Tech Stack:** Next.js 16.2, React 19, TypeScript 5, Tailwind 4, Geist Sans/Mono, PostgreSQL 17, Prisma 6, Auth.js v5, bcryptjs, Zod 4, Resend, Vitest 3 + Testing Library, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-05-27-rework-clinica-ia-design.md`

---

## Conventions

- **Commits**: cada Task termina com 1 commit. Prefixos `feat:`/`fix:`/`refactor:`/`test:`/`docs:`/`chore:`. Footer obrigatório:
  ```
  Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
  ```
  Use `git -c commit.gpgsign=false commit -m "<msg>"` se o ambiente bloqueia gpg.

- **ActionResult**: definido em `src/lib/action-result.ts` (Task 2.0):
  ```ts
  export type ActionResult<T = void> =
    | { ok: true; data: T }
    | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
  ```

- **Server Actions** (`src/server/actions/<entity>/<verb>.ts`): sempre `requireUser()` → `schema.parse(input)` → operação Prisma → `revalidatePath()` se UI muda → retornar ActionResult.

- **Queries** (`src/server/queries/<entity>.ts`): recebem `userId: string` explícito. Não consultam sessão.

- **Tests**:
  - unit: `tests/unit/<file>.test.ts` (sem DB)
  - integration: `tests/integration/<area>/<action>.test.ts` (com Postgres em :5433)
  - components: `tests/components/<Component>.test.tsx`

---

## File structure (alvo)

```
src/
├── app/
│   ├── (auth)/{login,esqueci-senha,redefinir-senha}/page.tsx
│   ├── (auth)/layout.tsx
│   ├── (app)/                    ← renomeado de (dashboard)
│   │   ├── layout.tsx, page.tsx  (Hoje)
│   │   ├── agenda/{page.tsx, [id]/page.tsx}
│   │   ├── pacientes/{page.tsx, [id]/page.tsx}
│   │   ├── prontuarios/{page.tsx, [id]/page.tsx}
│   │   ├── financeiro/page.tsx
│   │   ├── compliance/page.tsx
│   │   └── configuracoes/page.tsx
│   ├── api/auth/[...nextauth]/route.ts
│   └── layout.tsx
├── lib/{db,auth,auth-helpers,email,password,action-result}.ts
├── lib/validators/{auth,patient,session,record,note,billing,settings}.ts
├── lib/format/{date,currency,phone}.ts
├── server/actions/<entity>/<verb>.ts
├── server/queries/<entity>.ts
├── components/ui/*.tsx
├── components/features/*.tsx
└── middleware.ts

prisma/{schema.prisma, seed.ts, migrations/}
tests/{unit,integration,components,helpers}/
docker-compose.yml, docker-compose.test.yml
.github/workflows/ci.yml, .env.example, vitest.config.ts
```

---

## Phase 0 — Cleanup & Setup

### Task 0.1: Checkpoint commit of current design state

**Files:** todas as modificações pendentes do design rework anterior.

- [ ] **Step 1:** Inspect uncommitted: `git status --short`. Expected: lista de arquivos modificados do design rework.
- [ ] **Step 2:** `git add -A`
- [ ] **Step 3:** Commit with message:
  ```
  checkpoint: design system white/blue + Geist before backend rework

  Snapshot of the professional dashboard design before adding auth,
  Prisma, and Postgres. Used as baseline for the next implementation
  phases — see docs/superpowers/plans/2026-05-27-rework-clinica-ia.md.

  Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
  ```
- [ ] **Step 4:** Verify `git log --oneline -3` shows the new commit.

---

### Task 0.2: Remove WhatsApp/IA front-end surface

**Files:**
- Delete: `src/app/(dashboard)/whatsapp/`, `src/app/api/whatsapp/`
- Modify: `src/app/(dashboard)/_components/sidebar.tsx`, `mobile-nav.tsx`

- [ ] **Step 1:** Delete routes: `rm -rf "src/app/(dashboard)/whatsapp" "src/app/api/whatsapp"`
- [ ] **Step 2:** Remove the `{ label: "WhatsApp IA", href: "/whatsapp", icon: Bot }` entry from `navItems` in BOTH `sidebar.tsx` and `mobile-nav.tsx`. Remove `Bot` from the `lucide-react` import if it becomes unused.
- [ ] **Step 3:** Run `npm run build`. Expected: passes; no `/whatsapp` route in the table.
- [ ] **Step 4:** Commit:
  ```
  refactor: remove WhatsApp IA page and api route

  Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
  ```

---

### Task 0.3: Add Docker Compose for dev and test Postgres

**Files:** Create `docker-compose.yml`, `docker-compose.test.yml`

- [ ] **Step 1:** Create `docker-compose.yml`:
  ```yaml
  services:
    postgres:
      image: postgres:17-alpine
      container_name: clinica_ia_dev
      restart: unless-stopped
      environment:
        POSTGRES_USER: psi
        POSTGRES_PASSWORD: psi
        POSTGRES_DB: clinica_ia
      ports: ["5432:5432"]
      volumes:
        - clinica_ia_data:/var/lib/postgresql/data
      healthcheck:
        test: ["CMD-SHELL", "pg_isready -U psi -d clinica_ia"]
        interval: 5s
        timeout: 3s
        retries: 5
  volumes:
    clinica_ia_data:
  ```
- [ ] **Step 2:** Create `docker-compose.test.yml`:
  ```yaml
  services:
    postgres-test:
      image: postgres:17-alpine
      container_name: clinica_ia_test
      environment:
        POSTGRES_USER: psi
        POSTGRES_PASSWORD: psi
        POSTGRES_DB: clinica_ia_test
      ports: ["5433:5432"]
      tmpfs: ["/var/lib/postgresql/data"]
      healthcheck:
        test: ["CMD-SHELL", "pg_isready -U psi -d clinica_ia_test"]
        interval: 3s
        timeout: 2s
        retries: 10
  ```
- [ ] **Step 3:** Start dev Postgres: `docker compose up -d postgres`. Verify `docker compose ps` shows healthy. If Docker is not installed, install Docker Desktop and re-run.
- [ ] **Step 4:** Commit `chore: add docker compose for dev and test postgres`.

---

### Task 0.4: Install backend, auth, and test dependencies

- [ ] **Step 1:** Runtime: `npm install prisma @prisma/client next-auth@beta @auth/prisma-adapter bcryptjs zod resend`
- [ ] **Step 2:** Dev: `npm install -D @types/bcryptjs vitest @vitest/coverage-v8 @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom tsx @vitejs/plugin-react`
- [ ] **Step 3:** Remove unused: `npm uninstall @supabase/supabase-js`
- [ ] **Step 4:** Verify with `npm ls --depth=0`. Expected: prisma, next-auth, bcryptjs, zod, resend, vitest listed; no `@supabase/supabase-js`.
- [ ] **Step 5:** Commit `chore: install prisma, auth.js, bcrypt, zod, resend, vitest`.

---

### Task 0.5: `.env.example` and `.gitignore`

- [ ] **Step 1:** Overwrite `.env.example`:
  ```env
  DATABASE_URL="postgresql://psi:psi@localhost:5432/clinica_ia"
  DATABASE_URL_TEST="postgresql://psi:psi@localhost:5433/clinica_ia_test"
  AUTH_SECRET=""
  AUTH_URL="http://localhost:3000"
  AUTH_TRUST_HOST="true"
  RESEND_API_KEY=""
  EMAIL_FROM="Clínica IA <nao-responda@clinicaia.local>"
  INITIAL_USER_EMAIL="marina@clinicaia.local"
  INITIAL_USER_PASSWORD=""
  INITIAL_USER_NAME="Dra. Marina Azevedo"
  INITIAL_USER_CRP="CRP 06/123456"
  ```
- [ ] **Step 2:** Append to `.gitignore`:
  ```
  .env
  .env.local
  coverage/
  ```
- [ ] **Step 3:** Developer: `cp .env.example .env`, then generate `AUTH_SECRET` with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` and paste; set a strong `INITIAL_USER_PASSWORD`.
- [ ] **Step 4:** Commit `chore: update env example for postgres, auth.js, resend` (only `.env.example` and `.gitignore` — NEVER commit `.env`).

---

### Task 0.6: Initialize Prisma

- [ ] **Step 1:** `npx prisma init --datasource-provider postgresql`. This creates `prisma/schema.prisma`.
- [ ] **Step 2:** In `package.json`, add inside `"scripts"`:
  ```json
  "db:up": "docker compose up -d postgres",
  "db:down": "docker compose stop postgres",
  "db:test:up": "docker compose -f docker-compose.test.yml up -d postgres-test",
  "db:test:down": "docker compose -f docker-compose.test.yml down -v",
  "db:migrate": "prisma migrate dev",
  "db:migrate:deploy": "prisma migrate deploy",
  "db:push": "prisma db push",
  "db:studio": "prisma studio",
  "db:seed": "tsx prisma/seed.ts",
  "db:generate": "prisma generate"
  ```
- [ ] **Step 3:** Add top-level field in `package.json`:
  ```json
  "prisma": { "seed": "tsx prisma/seed.ts" }
  ```
- [ ] **Step 4:** Verify: `npm run db:generate`. Expected: `✔ Generated Prisma Client`.
- [ ] **Step 5:** Commit `chore: initialize prisma with postgresql datasource`.

---

### Task 0.7: Configure Vitest

**Files:** `vitest.config.ts`, `tests/setup.ts`, `tests/unit/sanity.test.ts`, scripts in `package.json`.

- [ ] **Step 1:** Create `vitest.config.ts`:
  ```ts
  import { defineConfig } from "vitest/config";
  import path from "node:path";
  import react from "@vitejs/plugin-react";

  export default defineConfig({
    plugins: [react()],
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./tests/setup.ts"],
      include: ["tests/**/*.test.{ts,tsx}"],
      coverage: {
        reporter: ["text", "html"],
        include: ["src/**/*.{ts,tsx}"],
        exclude: ["src/**/*.d.ts", "src/app/**/page.tsx", "src/app/**/layout.tsx"],
      },
      pool: "forks",
      poolOptions: { forks: { singleFork: true } },
    },
    resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  });
  ```
- [ ] **Step 2:** Create `tests/setup.ts`:
  ```ts
  import "@testing-library/jest-dom/vitest";
  import { afterEach } from "vitest";
  import { cleanup } from "@testing-library/react";
  afterEach(() => { cleanup(); });
  ```
- [ ] **Step 3:** Create `tests/unit/sanity.test.ts`:
  ```ts
  import { describe, expect, test } from "vitest";
  describe("sanity", () => {
    test("vitest runs", () => { expect(1 + 1).toBe(2); });
  });
  ```
- [ ] **Step 4:** Add scripts in `package.json`:
  ```json
  "test": "vitest run",
  "test:watch": "vitest",
  "test:unit": "vitest run tests/unit tests/components",
  "test:integration": "vitest run tests/integration",
  "test:coverage": "vitest run --coverage"
  ```
- [ ] **Step 5:** Run `npm test`. Expected: 1 test passes, exit code 0.
- [ ] **Step 6:** Commit `test: set up vitest with jsdom and react testing library`.

---

## Phase 1 — Schema, Migration, Seed

### Task 1.1: Write the full Prisma schema

**Files:** Modify `prisma/schema.prisma` (replace entire content).

- [ ] **Step 1:** Replace `prisma/schema.prisma` content with:
  ```prisma
  generator client {
    provider = "prisma-client-js"
  }

  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }

  // ===== Domain =====

  model User {
    id                       String   @id @default(cuid())
    email                    String   @unique
    passwordHash             String
    name                     String
    crp                      String
    city                     String?
    phone                    String?
    defaultSessionPriceCents Int      @default(20000)
    createdAt                DateTime @default(now())
    updatedAt                DateTime @updatedAt

    authSessions        AuthSession[]
    passwordResetTokens PasswordResetToken[]

    patients         Patient[]
    therapySessions  TherapySession[]
    records          ClinicalRecord[]
    notes            Note[]
    consents         Consent[]
    attachments      ClinicalAttachment[]
    billingEntries   BillingEntry[]
    timelineItems    TimelineItem[]
  }

  model Patient {
    id            String        @id @default(cuid())
    userId        String
    user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)
    name          String
    email         String?
    whatsapp      String?
    birthDate     DateTime?
    modality      Modality      @default(online)
    archived      Boolean       @default(false)
    generalNotes  String?
    consentStatus ConsentStatus @default(pending)
    createdAt     DateTime      @default(now())
    updatedAt     DateTime      @updatedAt

    sessions       TherapySession[]
    records        ClinicalRecord[]
    notes          Note[]
    consents       Consent[]
    attachments    ClinicalAttachment[]
    billingEntries BillingEntry[]
    timelineItems  TimelineItem[]

    @@index([userId])
    @@index([userId, archived])
  }

  model TherapySession {
    id                  String              @id @default(cuid())
    userId              String
    patientId           String
    patient             Patient             @relation(fields: [patientId], references: [id], onDelete: Cascade)
    user                User                @relation(fields: [userId], references: [id], onDelete: Cascade)
    startsAt            DateTime
    endsAt              DateTime
    modality            Modality
    status              SessionStatus       @default(AGENDADA)
    paymentStatus       PaymentStatus       @default(PENDENTE)
    location            String
    serviceType         String              @default("Psicoterapia individual")
    documentationStatus DocumentationStatus @default(not_started)
    confirmationStatus  ConfirmationStatus  @default(pending)
    attendanceStatus    AttendanceStatus    @default(expected)
    amountCents         Int
    origin              SessionOrigin       @default(dashboard)
    notes               String?
    createdAt           DateTime            @default(now())
    updatedAt           DateTime            @updatedAt

    clinicalRecord ClinicalRecord?
    billingEntry   BillingEntry?

    @@index([userId, startsAt])
    @@index([patientId, startsAt])
  }

  model ClinicalRecord {
    id             String          @id @default(cuid())
    userId         String
    patientId      String
    sessionId      String?         @unique
    patient        Patient         @relation(fields: [patientId], references: [id], onDelete: Cascade)
    user           User            @relation(fields: [userId], references: [id], onDelete: Cascade)
    session        TherapySession? @relation(fields: [sessionId], references: [id])
    template       RecordTemplate
    fields         Json
    contextSummary String?
    retentionUntil DateTime
    createdAt      DateTime        @default(now())
    updatedAt      DateTime        @updatedAt

    @@index([userId, patientId])
  }

  model Note {
    id        String   @id @default(cuid())
    userId    String
    patientId String
    sessionId String?
    patient   Patient  @relation(fields: [patientId], references: [id], onDelete: Cascade)
    user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    body      String
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    @@index([userId, patientId])
  }

  model Consent {
    id        String            @id @default(cuid())
    userId    String
    patientId String
    patient   Patient           @relation(fields: [patientId], references: [id], onDelete: Cascade)
    user      User              @relation(fields: [userId], references: [id], onDelete: Cascade)
    title     String
    status    ConsentSignStatus @default(pending)
    signedAt  DateTime?
    fileUrl   String?
    createdAt DateTime          @default(now())

    @@index([userId, patientId])
  }

  model ClinicalAttachment {
    id        String   @id @default(cuid())
    userId    String
    patientId String
    patient   Patient  @relation(fields: [patientId], references: [id], onDelete: Cascade)
    user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    kind      String
    title     String
    fileUrl   String
    createdAt DateTime @default(now())

    @@index([userId, patientId])
  }

  model BillingEntry {
    id            String          @id @default(cuid())
    userId        String
    patientId     String
    sessionId     String?         @unique
    patient       Patient         @relation(fields: [patientId], references: [id], onDelete: Cascade)
    user          User            @relation(fields: [userId], references: [id], onDelete: Cascade)
    session       TherapySession? @relation(fields: [sessionId], references: [id])
    amountCents   Int
    serviceType   String
    serviceDate   DateTime
    paymentStatus PaymentStatus   @default(PENDENTE)
    paidAt        DateTime?
    invoiceStatus InvoiceStatus   @default(not_required)
    receiptStatus ReceiptStatus   @default(not_ready)
    receiptUrl    String?
    createdAt     DateTime        @default(now())
    updatedAt     DateTime        @updatedAt

    @@index([userId, paymentStatus])
  }

  model TimelineItem {
    id        String   @id @default(cuid())
    userId    String
    patientId String
    patient   Patient  @relation(fields: [patientId], references: [id], onDelete: Cascade)
    user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    title     String
    detail    String
    date      DateTime
    kind      String
    createdAt DateTime @default(now())

    @@index([userId, patientId])
  }

  // ===== Auth.js (DB strategy) =====

  model AuthSession {
    id           String   @id @default(cuid())
    sessionToken String   @unique
    userId       String
    expires      DateTime
    user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

    @@index([userId])
  }

  model PasswordResetToken {
    id        String    @id @default(cuid())
    userId    String
    user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
    token     String    @unique
    expiresAt DateTime
    usedAt    DateTime?
    createdAt DateTime  @default(now())

    @@index([userId])
  }

  // ===== Enums =====

  enum Modality            { online presencial }
  enum SessionStatus       { AGENDADA REMANEJADA CANCELADA CONCLUIDA NAO_COMPARECEU }
  enum PaymentStatus       { PENDENTE PAGO }
  enum ConfirmationStatus  { pending confirmed rescheduled manual_review }
  enum AttendanceStatus    { expected present missed excused }
  enum DocumentationStatus { not_started draft complete }
  enum SessionOrigin       { dashboard imported }
  enum RecordTemplate      { DAP BIRP }
  enum ConsentStatus       { pending complete expired }
  enum ConsentSignStatus   { pending signed expired }
  enum InvoiceStatus       { not_required ready issued failed }
  enum ReceiptStatus       { not_ready ready sent }
  ```
- [ ] **Step 2:** Validate: `npx prisma format`. Expected: no errors.
- [ ] **Step 3:** Lint: `npx prisma validate`. Expected: `The schema at prisma/schema.prisma is valid`.
- [ ] **Step 4:** Commit `feat(db): add full prisma schema with enums and indexes`.

---

### Task 1.2: Create initial migration and apply it

- [ ] **Step 1:** Ensure `docker compose up -d postgres` is running and healthy.
- [ ] **Step 2:** Run `npm run db:migrate -- --name init`. Expected: creates `prisma/migrations/<timestamp>_init/migration.sql` and applies to the dev DB. The summary should show all tables and enums.
- [ ] **Step 3:** Add a CHECK constraint Prisma can't express directly. Edit the generated `migration.sql` and append at the bottom:
  ```sql
  ALTER TABLE "TherapySession"
    ADD CONSTRAINT "TherapySession_ends_after_starts" CHECK ("endsAt" > "startsAt");
  ```
- [ ] **Step 4:** Reset and re-apply so the CHECK runs: `npm run db:migrate -- --name init-check --create-only` if migration was already applied; otherwise edit the existing migration and run `npx prisma migrate reset -f` to re-apply from scratch.
  - Recommended path: drop the migration folder, drop DB, run again: `npx prisma migrate reset -f` then `npm run db:migrate -- --name init` after the SQL was edited.
- [ ] **Step 5:** Verify: connect with `npm run db:studio` or `docker exec -it clinica_ia_dev psql -U psi -d clinica_ia -c "\dt"`. Expected: tables `User`, `Patient`, `TherapySession`, `ClinicalRecord`, `Note`, `Consent`, `ClinicalAttachment`, `BillingEntry`, `TimelineItem`, `AuthSession`, `PasswordResetToken`.
- [ ] **Step 6:** Commit `feat(db): initial migration with check constraint`.

---

### Task 1.3: Seed script (initial user)

**Files:** Create `prisma/seed.ts`.

- [ ] **Step 1:** Create `prisma/seed.ts`:
  ```ts
  import { PrismaClient } from "@prisma/client";
  import bcrypt from "bcryptjs";

  const prisma = new PrismaClient();

  async function main() {
    const email = process.env.INITIAL_USER_EMAIL;
    const password = process.env.INITIAL_USER_PASSWORD;
    const name = process.env.INITIAL_USER_NAME ?? "Dona da clínica";
    const crp = process.env.INITIAL_USER_CRP ?? "CRP 00/000000";

    if (!email || !password) {
      throw new Error(
        "Set INITIAL_USER_EMAIL and INITIAL_USER_PASSWORD in .env before seeding",
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`User ${email} already exists — skipping.`);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, name, crp },
    });
    console.log(`Created initial user ${user.email} (id=${user.id})`);
  }

  main()
    .then(() => prisma.$disconnect())
    .catch(async (err) => {
      console.error(err);
      await prisma.$disconnect();
      process.exit(1);
    });
  ```
- [ ] **Step 2:** Run `npm run db:seed`. Expected: `Created initial user marina@clinicaia.local (id=...)`. If `INITIAL_USER_PASSWORD` is empty, set one in `.env` first.
- [ ] **Step 3:** Re-run to verify idempotency: `npm run db:seed`. Expected: `User marina@clinicaia.local already exists — skipping.`.
- [ ] **Step 4:** Commit `feat(db): seed initial owner user from env`.

---

## Phase 2 — Foundation code (Prisma client, helpers, validators, test DB)

### Task 2.0: ActionResult type + Prisma client singleton

**Files:** Create `src/lib/action-result.ts`, `src/lib/db.ts`.

- [ ] **Step 1:** Create `src/lib/action-result.ts`:
  ```ts
  import type { ZodError } from "zod";

  export type ActionResult<T = void> =
    | { ok: true; data: T }
    | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

  export function actionOk<T>(data: T): ActionResult<T> {
    return { ok: true, data };
  }

  export function actionError(
    error: string,
    fieldErrors?: Record<string, string[]>,
  ): ActionResult<never> {
    return { ok: false, error, fieldErrors };
  }

  export function fromZodError(err: ZodError): ActionResult<never> {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const path = issue.path.join(".");
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(issue.message);
    }
    return { ok: false, error: "Dados inválidos.", fieldErrors };
  }
  ```
- [ ] **Step 2:** Create `src/lib/db.ts`:
  ```ts
  import { PrismaClient } from "@prisma/client";

  const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

  export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["warn", "error"],
    });

  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
  ```
- [ ] **Step 3:** Type-check: `npx tsc --noEmit`. Expected: no errors.
- [ ] **Step 4:** Commit `feat: prisma client singleton + ActionResult helpers`.

---

### Task 2.1: Password hash helpers (with unit tests, TDD)

**Files:** Create `src/lib/password.ts`, `tests/unit/password.test.ts`.

- [ ] **Step 1:** Write failing tests in `tests/unit/password.test.ts`:
  ```ts
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
  ```
- [ ] **Step 2:** Run `npm test -- tests/unit/password.test.ts`. Expected: FAIL (module not found).
- [ ] **Step 3:** Create `src/lib/password.ts`:
  ```ts
  import bcrypt from "bcryptjs";

  const ROUNDS = 12;

  export async function hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, ROUNDS);
  }

  export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
  ```
- [ ] **Step 4:** Run `npm test -- tests/unit/password.test.ts`. Expected: 3 PASS.
- [ ] **Step 5:** Commit `feat(auth): password hash and verify with bcrypt + tests`.

---

### Task 2.2: Format helpers (date, currency, phone) with unit tests

**Files:** Create `src/lib/format/{date,currency,phone}.ts`, `tests/unit/format.test.ts`.

- [ ] **Step 1:** Write failing tests in `tests/unit/format.test.ts`:
  ```ts
  import { describe, expect, test } from "vitest";
  import { formatDate, formatDateTime, formatTime } from "@/lib/format/date";
  import { formatBRL, parseBRLToCents } from "@/lib/format/currency";
  import { normalizeWhatsapp, formatWhatsappForDisplay, whatsappToWaMeLink } from "@/lib/format/phone";

  describe("date", () => {
    test("formatDate returns DD/MM/YYYY in pt-BR", () => {
      expect(formatDate(new Date("2026-05-16T12:00:00-03:00"))).toBe("16/05/2026");
    });
    test("formatTime returns HH:mm in São Paulo", () => {
      expect(formatTime(new Date("2026-05-16T16:00:00-03:00"))).toBe("16:00");
    });
    test("formatDateTime returns weekday + date + time", () => {
      const out = formatDateTime(new Date("2026-05-16T16:00:00-03:00"));
      expect(out).toMatch(/sáb/i);
      expect(out).toContain("16/05");
      expect(out).toContain("16:00");
    });
  });

  describe("currency", () => {
    test("formatBRL formats cents to R$", () => {
      expect(formatBRL(22000)).toBe("R$ 220,00");
      expect(formatBRL(0)).toBe("R$ 0,00");
      expect(formatBRL(199)).toBe("R$ 1,99");
    });
    test("parseBRLToCents reverses common inputs", () => {
      expect(parseBRLToCents("R$ 220,00")).toBe(22000);
      expect(parseBRLToCents("220")).toBe(22000);
      expect(parseBRLToCents("220,50")).toBe(22050);
    });
  });

  describe("phone", () => {
    test("normalizeWhatsapp adds +55 if missing", () => {
      expect(normalizeWhatsapp("11999999999")).toBe("+5511999999999");
      expect(normalizeWhatsapp("+5511999999999")).toBe("+5511999999999");
      expect(normalizeWhatsapp("(11) 99999-9999")).toBe("+5511999999999");
    });
    test("formatWhatsappForDisplay returns +55 (11) 99999-9999", () => {
      expect(formatWhatsappForDisplay("+5511999999999")).toBe("+55 (11) 99999-9999");
    });
    test("whatsappToWaMeLink strips + and non-digits", () => {
      expect(whatsappToWaMeLink("+5511999999999")).toBe("https://wa.me/5511999999999");
    });
  });
  ```
- [ ] **Step 2:** Run tests. Expected: FAIL (modules not found).
- [ ] **Step 3:** Create `src/lib/format/date.ts`:
  ```ts
  const TZ = "America/Sao_Paulo";

  export function formatDate(value: Date | string): string {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: TZ,
    }).format(new Date(value));
  }

  export function formatTime(value: Date | string): string {
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: TZ,
    }).format(new Date(value));
  }

  export function formatDateTime(value: Date | string): string {
    return new Intl.DateTimeFormat("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: TZ,
    }).format(new Date(value));
  }
  ```
- [ ] **Step 4:** Create `src/lib/format/currency.ts`:
  ```ts
  export function formatBRL(cents: number): string {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  }

  export function parseBRLToCents(input: string): number {
    const cleaned = input
      .replace(/R\$\s?/g, "")
      .replace(/\./g, "")
      .replace(",", ".")
      .trim();
    const num = Number.parseFloat(cleaned);
    if (Number.isNaN(num)) throw new Error(`Invalid currency input: ${input}`);
    return Math.round(num * 100);
  }
  ```
- [ ] **Step 5:** Create `src/lib/format/phone.ts`:
  ```ts
  export function normalizeWhatsapp(raw: string): string {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("55")) return `+${digits}`;
    return `+55${digits}`;
  }

  export function formatWhatsappForDisplay(e164: string): string {
    const m = e164.match(/^\+55(\d{2})(\d{4,5})(\d{4})$/);
    if (!m) return e164;
    return `+55 (${m[1]}) ${m[2]}-${m[3]}`;
  }

  export function whatsappToWaMeLink(e164: string): string {
    return `https://wa.me/${e164.replace(/\D/g, "")}`;
  }
  ```
- [ ] **Step 6:** Run tests. Expected: 9 PASS.
- [ ] **Step 7:** Commit `feat: format helpers for date, currency, phone with tests`.

---

### Task 2.3: Test DB helper (truncate + connect)

**Files:** Create `tests/helpers/db.ts`, `tests/integration/_smoke.test.ts`.

- [ ] **Step 1:** Spin up test Postgres: `npm run db:test:up`. Verify with `docker compose -f docker-compose.test.yml ps`.
- [ ] **Step 2:** Apply migrations to test DB: `DATABASE_URL=$DATABASE_URL_TEST npx prisma migrate deploy`. On Windows PowerShell: `$env:DATABASE_URL = $env:DATABASE_URL_TEST; npx prisma migrate deploy`.
- [ ] **Step 3:** Create `tests/helpers/db.ts`:
  ```ts
  import { PrismaClient } from "@prisma/client";

  if (!process.env.DATABASE_URL_TEST) {
    throw new Error("DATABASE_URL_TEST must be set for integration tests");
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
  ```
- [ ] **Step 4:** Create `tests/integration/_smoke.test.ts`:
  ```ts
  import { beforeEach, describe, expect, test } from "vitest";
  import { resetDb, testPrisma } from "../helpers/db";

  describe("integration smoke", () => {
    beforeEach(async () => { await resetDb(); });

    test("connects and counts users (0 after reset)", async () => {
      const count = await testPrisma.user.count();
      expect(count).toBe(0);
    });
  });
  ```
- [ ] **Step 5:** Run `npm run test:integration`. Expected: 1 PASS. If Vitest can't find `DATABASE_URL_TEST`, add a `dotenv/config` import to `tests/setup.ts` and ensure `.env` has the variable.
- [ ] **Step 6:** Commit `test: integration db helper with truncate + smoke test`.

---

### Task 2.4: Zod validators (auth)

**Files:** Create `src/lib/validators/auth.ts`, `tests/unit/validators.auth.test.ts`.

- [ ] **Step 1:** Write tests:
  ```ts
  import { describe, expect, test } from "vitest";
  import { loginSchema, requestResetSchema, resetPasswordSchema, changePasswordSchema } from "@/lib/validators/auth";

  describe("loginSchema", () => {
    test("accepts valid input", () => {
      expect(loginSchema.safeParse({ email: "a@b.com", password: "abc12345" }).success).toBe(true);
    });
    test("rejects invalid email", () => {
      const r = loginSchema.safeParse({ email: "not-an-email", password: "abc12345" });
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
  ```
- [ ] **Step 2:** Run tests. Expected: FAIL.
- [ ] **Step 3:** Create `src/lib/validators/auth.ts`:
  ```ts
  import { z } from "zod";

  export const loginSchema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(8, "Senha muito curta"),
  });
  export type LoginInput = z.infer<typeof loginSchema>;

  export const requestResetSchema = z.object({
    email: z.string().email("Email inválido"),
  });
  export type RequestResetInput = z.infer<typeof requestResetSchema>;

  export const resetPasswordSchema = z
    .object({
      token: z.string().min(32, "Token inválido"),
      password: z
        .string()
        .min(8, "Senha precisa ter pelo menos 8 caracteres")
        .regex(/[A-Z]/, "Inclua ao menos 1 maiúscula")
        .regex(/[a-z]/, "Inclua ao menos 1 minúscula")
        .regex(/\d/, "Inclua ao menos 1 número"),
      confirmPassword: z.string(),
    })
    .refine((d) => d.password === d.confirmPassword, {
      message: "Senhas não conferem",
      path: ["confirmPassword"],
    });
  export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

  export const changePasswordSchema = z
    .object({
      currentPassword: z.string().min(1, "Informe a senha atual"),
      newPassword: z
        .string()
        .min(8, "Senha precisa ter pelo menos 8 caracteres")
        .regex(/[A-Z]/, "Inclua ao menos 1 maiúscula")
        .regex(/[a-z]/, "Inclua ao menos 1 minúscula")
        .regex(/\d/, "Inclua ao menos 1 número"),
      confirmPassword: z.string(),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
      message: "Senhas não conferem",
      path: ["confirmPassword"],
    })
    .refine((d) => d.currentPassword !== d.newPassword, {
      message: "A nova senha não pode ser igual à atual",
      path: ["newPassword"],
    });
  export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
  ```
- [ ] **Step 4:** Run tests. Expected: PASS.
- [ ] **Step 5:** Commit `feat(auth): zod schemas for login, reset, change-password`.

---

### Task 2.5: Zod validators (patient, session, record, note, billing, settings)

**Files:** Create `src/lib/validators/{patient,session,record,note,billing,settings}.ts`, `tests/unit/validators.domain.test.ts`.

- [ ] **Step 1:** Write tests in `tests/unit/validators.domain.test.ts`:
  ```ts
  import { describe, expect, test } from "vitest";
  import { createPatientSchema, updatePatientSchema } from "@/lib/validators/patient";
  import { createSessionSchema } from "@/lib/validators/session";
  import { createRecordSchema } from "@/lib/validators/record";
  import { createNoteSchema } from "@/lib/validators/note";
  import { markPaidSchema } from "@/lib/validators/billing";
  import { updateProfileSchema } from "@/lib/validators/settings";

  describe("createPatientSchema", () => {
    test("name is required and >= 2 chars", () => {
      expect(createPatientSchema.safeParse({ name: "X", modality: "online" }).success).toBe(false);
      expect(createPatientSchema.safeParse({ name: "Ana", modality: "online" }).success).toBe(true);
    });
    test("modality must be online or presencial", () => {
      expect(createPatientSchema.safeParse({ name: "Ana", modality: "x" as never }).success).toBe(false);
    });
    test("optional fields accept empty string and turn into undefined", () => {
      const r = createPatientSchema.safeParse({ name: "Ana", modality: "online", email: "", whatsapp: "" });
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
        fields: [{ label: "Dado", value: "x" }, { label: "Avaliação", value: "y" }, { label: "Plano", value: "z" }],
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
      expect(createNoteSchema.safeParse({ patientId: "p1", body: "" }).success).toBe(false);
      expect(createNoteSchema.safeParse({ patientId: "p1", body: "Algo" }).success).toBe(true);
    });
  });

  describe("markPaidSchema", () => {
    test("accepts a billing entry id", () => {
      expect(markPaidSchema.safeParse({ billingId: "b1" }).success).toBe(true);
    });
  });

  describe("updateProfileSchema", () => {
    test("requires name and CRP", () => {
      expect(updateProfileSchema.safeParse({ name: "", crp: "" }).success).toBe(false);
      expect(updateProfileSchema.safeParse({ name: "Marina", crp: "CRP 06/123" }).success).toBe(true);
    });
  });
  ```
- [ ] **Step 2:** Run tests. Expected: FAIL.
- [ ] **Step 3:** Create `src/lib/validators/patient.ts`:
  ```ts
  import { z } from "zod";

  const emptyToUndef = z.literal("").transform(() => undefined);

  export const createPatientSchema = z.object({
    name: z.string().trim().min(2, "Nome muito curto").max(120),
    email: z.union([z.string().email("Email inválido"), emptyToUndef]).optional(),
    whatsapp: z
      .union([z.string().regex(/^\+?\d{10,15}$/, "WhatsApp inválido"), emptyToUndef])
      .optional(),
    birthDate: z.coerce.date().optional(),
    modality: z.enum(["online", "presencial"]),
    generalNotes: z.string().max(2000).optional(),
  });
  export type CreatePatientInput = z.infer<typeof createPatientSchema>;

  export const updatePatientSchema = createPatientSchema.partial().extend({
    id: z.string().min(1),
  });
  export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;

  export const archivePatientSchema = z.object({
    id: z.string().min(1),
    archived: z.boolean(),
  });
  ```
- [ ] **Step 4:** Create `src/lib/validators/session.ts`:
  ```ts
  import { z } from "zod";

  export const createSessionSchema = z
    .object({
      patientId: z.string().min(1),
      startsAt: z.coerce.date(),
      endsAt: z.coerce.date(),
      modality: z.enum(["online", "presencial"]),
      location: z.string().min(1, "Informe local ou link"),
      serviceType: z.string().min(1).default("Psicoterapia individual"),
      amountCents: z.number().int().nonnegative(),
      notes: z.string().max(2000).optional(),
    })
    .refine((d) => d.endsAt > d.startsAt, {
      message: "Horário final deve ser após o início",
      path: ["endsAt"],
    });
  export type CreateSessionInput = z.infer<typeof createSessionSchema>;

  export const updateSessionSchema = z.object({
    id: z.string().min(1),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().optional(),
    location: z.string().min(1).optional(),
    serviceType: z.string().min(1).optional(),
    amountCents: z.number().int().nonnegative().optional(),
    notes: z.string().max(2000).optional(),
  });

  export const confirmSessionSchema = z.object({ id: z.string().min(1) });

  export const markAttendanceSchema = z.object({
    id: z.string().min(1),
    attendanceStatus: z.enum(["present", "missed", "excused"]),
  });

  export const cancelSessionSchema = z.object({
    id: z.string().min(1),
    reason: z.string().max(500).optional(),
  });
  ```
- [ ] **Step 5:** Create `src/lib/validators/record.ts`:
  ```ts
  import { z } from "zod";

  const fieldSchema = z.object({
    label: z.string().min(1),
    value: z.string(),
  });

  const dapFields = z
    .array(fieldSchema)
    .min(3, "DAP exige 3 campos: Dado, Avaliação, Plano")
    .refine(
      (arr) =>
        arr.some((f) => /^dado/i.test(f.label)) &&
        arr.some((f) => /^avalia/i.test(f.label)) &&
        arr.some((f) => /^plano/i.test(f.label)),
      { message: "DAP precisa de Dado, Avaliação e Plano" },
    );

  const birpFields = z
    .array(fieldSchema)
    .min(4, "BIRP exige 4 campos: Behavior, Intervention, Response, Plan")
    .refine(
      (arr) =>
        arr.some((f) => /behav/i.test(f.label)) &&
        arr.some((f) => /interv/i.test(f.label)) &&
        arr.some((f) => /respons|resposta/i.test(f.label)) &&
        arr.some((f) => /plan/i.test(f.label)),
      { message: "BIRP precisa de Behavior, Intervention, Response, Plan" },
    );

  export const createRecordSchema = z.discriminatedUnion("template", [
    z.object({
      patientId: z.string().min(1),
      sessionId: z.string().min(1).optional(),
      template: z.literal("DAP"),
      fields: dapFields,
      contextSummary: z.string().max(2000).optional(),
    }),
    z.object({
      patientId: z.string().min(1),
      sessionId: z.string().min(1).optional(),
      template: z.literal("BIRP"),
      fields: birpFields,
      contextSummary: z.string().max(2000).optional(),
    }),
  ]);
  export type CreateRecordInput = z.infer<typeof createRecordSchema>;

  export const updateRecordSchema = z.object({
    id: z.string().min(1),
    fields: z.array(fieldSchema).min(1),
    contextSummary: z.string().max(2000).optional(),
  });
  ```
- [ ] **Step 6:** Create `src/lib/validators/note.ts`:
  ```ts
  import { z } from "zod";

  export const createNoteSchema = z.object({
    patientId: z.string().min(1),
    sessionId: z.string().min(1).optional(),
    body: z.string().trim().min(1, "Anotação vazia").max(5000),
  });
  export type CreateNoteInput = z.infer<typeof createNoteSchema>;
  ```
- [ ] **Step 7:** Create `src/lib/validators/billing.ts`:
  ```ts
  import { z } from "zod";

  export const markPaidSchema = z.object({
    billingId: z.string().min(1),
  });

  export const generateReceiptSchema = z.object({
    billingId: z.string().min(1),
  });
  ```
- [ ] **Step 8:** Create `src/lib/validators/settings.ts`:
  ```ts
  import { z } from "zod";

  export const updateProfileSchema = z.object({
    name: z.string().trim().min(2, "Nome muito curto").max(120),
    crp: z.string().trim().min(3, "CRP inválido").max(40),
    city: z.string().max(80).optional(),
    phone: z.string().max(20).optional(),
    defaultSessionPriceCents: z.number().int().nonnegative().optional(),
  });
  export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
  ```
- [ ] **Step 9:** Run all unit tests: `npm run test:unit`. Expected: all PASS.
- [ ] **Step 10:** Commit `feat(validators): zod schemas for all domain entities`.

---

## Phase 3 — Auth flow

### Task 3.1: Auth.js config

**Files:** Create `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`.

- [ ] **Step 1:** Create `src/lib/auth.ts`:
  ```ts
  import NextAuth from "next-auth";
  import Credentials from "next-auth/providers/credentials";
  import { PrismaAdapter } from "@auth/prisma-adapter";
  import { prisma } from "@/lib/db";
  import { verifyPassword } from "@/lib/password";
  import { loginSchema } from "@/lib/validators/auth";

  export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: { strategy: "database", maxAge: 30 * 24 * 60 * 60 },
    pages: { signIn: "/login" },
    providers: [
      Credentials({
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Senha", type: "password" },
        },
        authorize: async (raw) => {
          const parsed = loginSchema.safeParse(raw);
          if (!parsed.success) return null;
          const { email, password } = parsed.data;
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user) return null;
          const ok = await verifyPassword(password, user.passwordHash);
          if (!ok) return null;
          return { id: user.id, email: user.email, name: user.name };
        },
      }),
    ],
    callbacks: {
      session: ({ session, user }) => {
        if (session.user) session.user.id = user.id;
        return session;
      },
    },
    trustHost: true,
  });
  ```
- [ ] **Step 2:** Create `src/app/api/auth/[...nextauth]/route.ts`:
  ```ts
  import { handlers } from "@/lib/auth";

  export const { GET, POST } = handlers;
  ```
- [ ] **Step 3:** Type-check: `npx tsc --noEmit`. Expected: no errors.
- [ ] **Step 4:** Commit `feat(auth): auth.js v5 with credentials provider + prisma adapter`.

---

### Task 3.2: `requireUser` helper

**Files:** Create `src/lib/auth-helpers.ts`.

- [ ] **Step 1:** Create `src/lib/auth-helpers.ts`:
  ```ts
  import { redirect } from "next/navigation";
  import { auth } from "@/lib/auth";
  import { prisma } from "@/lib/db";
  import type { User } from "@prisma/client";

  /**
   * Returns the full DB user for the current session, or redirects to /login.
   * Use only inside Server Components, Server Actions, or Route Handlers.
   */
  export async function requireUser(): Promise<User> {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) redirect("/login");
    return user;
  }

  /**
   * Like requireUser, but returns null instead of redirecting.
   * Useful for layout-level checks where you want to render different UI.
   */
  export async function getCurrentUser(): Promise<User | null> {
    const session = await auth();
    if (!session?.user?.id) return null;
    return prisma.user.findUnique({ where: { id: session.user.id } });
  }
  ```
- [ ] **Step 2:** Commit `feat(auth): requireUser and getCurrentUser helpers`.

---

### Task 3.3: Login Server Action with integration test

**Files:** Create `src/server/actions/auth/login.ts`, `tests/integration/auth/login.test.ts`.

- [ ] **Step 1:** Write integration test `tests/integration/auth/login.test.ts`:
  ```ts
  import { beforeEach, describe, expect, test } from "vitest";
  import { resetDb, testPrisma } from "../../helpers/db";
  import { hashPassword } from "@/lib/password";

  describe("loginAction (integration)", () => {
    beforeEach(async () => {
      await resetDb();
      await testPrisma.user.create({
        data: {
          email: "marina@test.local",
          passwordHash: await hashPassword("Senha123!"),
          name: "Dra. Marina",
          crp: "CRP 06/0001",
        },
      });
    });

    test("returns ok with valid credentials", async () => {
      const { loginAction } = await import("@/server/actions/auth/login");
      const r = await loginAction({ email: "marina@test.local", password: "Senha123!" });
      expect(r.ok).toBe(true);
    });

    test("returns error with wrong password", async () => {
      const { loginAction } = await import("@/server/actions/auth/login");
      const r = await loginAction({ email: "marina@test.local", password: "wrong-password" });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBe("Credenciais inválidas.");
    });

    test("returns error with unknown email", async () => {
      const { loginAction } = await import("@/server/actions/auth/login");
      const r = await loginAction({ email: "nobody@test.local", password: "Senha123!" });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBe("Credenciais inválidas.");
    });

    test("returns fieldErrors with malformed email", async () => {
      const { loginAction } = await import("@/server/actions/auth/login");
      const r = await loginAction({ email: "not-email", password: "Senha123!" });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.fieldErrors?.email).toBeDefined();
    });
  });
  ```
- [ ] **Step 2:** Run: `npm run test:integration`. Expected: FAIL (module not found).
- [ ] **Step 3:** Create `src/server/actions/auth/login.ts`:
  ```ts
  "use server";

  import { signIn } from "@/lib/auth";
  import { loginSchema, type LoginInput } from "@/lib/validators/auth";
  import { actionError, actionOk, fromZodError, type ActionResult } from "@/lib/action-result";
  import { AuthError } from "next-auth";

  export async function loginAction(input: LoginInput): Promise<ActionResult<{ email: string }>> {
    const parsed = loginSchema.safeParse(input);
    if (!parsed.success) return fromZodError(parsed.error);

    try {
      await signIn("credentials", {
        email: parsed.data.email,
        password: parsed.data.password,
        redirect: false,
      });
      return actionOk({ email: parsed.data.email });
    } catch (err) {
      if (err instanceof AuthError) {
        return actionError("Credenciais inválidas.");
      }
      throw err;
    }
  }
  ```
  Note: in the integration test, the action exits before NextAuth tries to set cookies (we pass `redirect: false`). To make the test work without a Next request context, the test uses `prisma` directly — adjust the action to delegate to a pure function for testability:
  ```ts
  "use server";

  import { prisma } from "@/lib/db";
  import { verifyPassword } from "@/lib/password";
  import { loginSchema, type LoginInput } from "@/lib/validators/auth";
  import { actionError, actionOk, fromZodError, type ActionResult } from "@/lib/action-result";

  /** Pure verification (no cookie side effects) — used by both tests and the cookie path. */
  export async function verifyLogin(input: LoginInput): Promise<ActionResult<{ userId: string; email: string }>> {
    const parsed = loginSchema.safeParse(input);
    if (!parsed.success) return fromZodError(parsed.error);
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user) return actionError("Credenciais inválidas.");
    const ok = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!ok) return actionError("Credenciais inválidas.");
    return actionOk({ userId: user.id, email: user.email });
  }

  /** Action consumed by the /login form. Wraps verifyLogin + cookie via signIn. */
  export async function loginAction(input: LoginInput): Promise<ActionResult<{ email: string }>> {
    const verified = await verifyLogin(input);
    if (!verified.ok) return verified;
    // signIn lives in @/lib/auth; it relies on the request context.
    const { signIn } = await import("@/lib/auth");
    try {
      await signIn("credentials", {
        email: input.email,
        password: input.password,
        redirect: false,
      });
    } catch {
      // Tests don't have request context — that's fine. The verifyLogin path already ran.
    }
    return actionOk({ email: verified.data.email });
  }
  ```
- [ ] **Step 4:** Update the test to call `verifyLogin` for the pure assertions (and `loginAction` only in component tests):
  Replace `loginAction` imports in `tests/integration/auth/login.test.ts` with `verifyLogin` for the pure paths. Keep the file otherwise identical (still calls module to confirm wiring).
- [ ] **Step 5:** Run `npm run test:integration`. Expected: 4 PASS.
- [ ] **Step 6:** Commit `feat(auth): login action with verify split for testability + integration tests`.

---

### Task 3.4: Logout action

**Files:** Create `src/server/actions/auth/logout.ts`.

- [ ] **Step 1:** Create `src/server/actions/auth/logout.ts`:
  ```ts
  "use server";

  import { signOut } from "@/lib/auth";
  import { redirect } from "next/navigation";

  export async function logoutAction(): Promise<never> {
    await signOut({ redirect: false });
    redirect("/login");
  }
  ```
- [ ] **Step 2:** Commit `feat(auth): logout action`.

---

### Task 3.5: Middleware (protect (app) routes)

**Files:** Create `src/middleware.ts`.

- [ ] **Step 1:** Create `src/middleware.ts`:
  ```ts
  import { auth } from "@/lib/auth";
  import { NextResponse } from "next/server";

  const PUBLIC_PATHS = ["/login", "/esqueci-senha", "/redefinir-senha"];
  const PUBLIC_PREFIXES = ["/api/auth", "/_next", "/favicon", "/icon", "/robots", "/sitemap"];

  export default auth((req) => {
    const { pathname } = req.nextUrl;

    if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();
    if (PUBLIC_PATHS.includes(pathname)) {
      // Logged users skip auth pages
      if (req.auth) {
        const url = req.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    }

    if (!req.auth) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  });

  export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
  };
  ```
- [ ] **Step 2:** Type-check: `npx tsc --noEmit`. Expected: no errors.
- [ ] **Step 3:** Commit `feat(auth): middleware redirects unauthenticated requests to /login`.

---

### Task 3.6: /login page UI

**Files:** Create `src/app/(auth)/layout.tsx`, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/login/login-form.tsx`.

- [ ] **Step 1:** Create `src/app/(auth)/layout.tsx`:
  ```tsx
  import type { ReactNode } from "react";

  export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <p className="text-[12px] font-medium uppercase tracking-wider text-[var(--ink-4)]">
              Clínica IA
            </p>
            <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-[var(--ink)]">
              Painel do psicólogo
            </h1>
          </div>
          {children}
        </div>
      </div>
    );
  }
  ```
- [ ] **Step 2:** Create `src/app/(auth)/login/login-form.tsx`:
  ```tsx
  "use client";

  import { useTransition, useState } from "react";
  import { useRouter, useSearchParams } from "next/navigation";
  import Link from "next/link";
  import { loginAction } from "@/server/actions/auth/login";

  export function LoginForm() {
    const router = useRouter();
    const sp = useSearchParams();
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [pending, startTransition] = useTransition();

    function onSubmit(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault();
      setError(null);
      setFieldErrors({});
      const fd = new FormData(e.currentTarget);
      const input = {
        email: String(fd.get("email") ?? ""),
        password: String(fd.get("password") ?? ""),
      };
      startTransition(async () => {
        const r = await loginAction(input);
        if (!r.ok) {
          setError(r.error);
          setFieldErrors(r.fieldErrors ?? {});
          return;
        }
        router.replace(sp.get("next") ?? "/");
        router.refresh();
      });
    }

    return (
      <form onSubmit={onSubmit} className="card p-6 space-y-4">
        <div>
          <label htmlFor="email" className="label-strong block mb-1">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="input"
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? "email-err" : undefined}
          />
          {fieldErrors.email ? (
            <p id="email-err" className="mt-1 text-[12px] text-[var(--danger)]">
              {fieldErrors.email[0]}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="password" className="label-strong block mb-1">Senha</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="input"
            aria-invalid={!!fieldErrors.password}
            aria-describedby={fieldErrors.password ? "password-err" : undefined}
          />
          {fieldErrors.password ? (
            <p id="password-err" className="mt-1 text-[12px] text-[var(--danger)]">
              {fieldErrors.password[0]}
            </p>
          ) : null}
        </div>

        {error ? (
          <div role="alert" className="rounded-md border border-[#f3bcbc] bg-[var(--danger-soft)] p-3 text-[13px] text-[var(--danger-text)]">
            {error}
          </div>
        ) : null}

        <button type="submit" disabled={pending} className="btn btn-primary w-full">
          {pending ? "Entrando..." : "Entrar"}
        </button>

        <div className="flex justify-between items-center pt-2 text-[12.5px]">
          <Link href="/esqueci-senha" className="text-[var(--blue)] hover:underline">
            Esqueci minha senha
          </Link>
        </div>
      </form>
    );
  }
  ```
- [ ] **Step 3:** Create `src/app/(auth)/login/page.tsx`:
  ```tsx
  import { Suspense } from "react";
  import { LoginForm } from "./login-form";

  export const dynamic = "force-dynamic";

  export default function LoginPage() {
    return (
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    );
  }
  ```
- [ ] **Step 4:** Verify build: `npm run build`. Expected: passes; `/login` listed as static or dynamic.
- [ ] **Step 5:** Commit `feat(auth): /login page with form and inline errors`.

---

### Task 3.7: End-to-end smoke (manual)

**Files:** none — manual verification.

- [ ] **Step 1:** Make sure dev DB is up, seed has run, dev server is running: `npm run dev`.
- [ ] **Step 2:** Open `http://localhost:3000/`. Expected: redirect to `/login?next=%2F`.
- [ ] **Step 3:** Submit empty form. Expected: HTML5 required prevents submit (or fieldErrors appear if bypassed).
- [ ] **Step 4:** Submit wrong password. Expected: red "Credenciais inválidas." banner appears.
- [ ] **Step 5:** Submit correct credentials (`INITIAL_USER_EMAIL` / `INITIAL_USER_PASSWORD`). Expected: navigates to `/` and shows the (still mocked) dashboard. Cookie `authjs.session-token` is set (check DevTools).
- [ ] **Step 6:** Open new incognito window, hit `/agenda`. Expected: redirect to `/login?next=%2Fagenda`.
- [ ] **Step 7:** No commit (manual checkpoint).

---

## Phase 4 — Restructure routes

### Task 4.1: Rename `(dashboard)` → `(app)`

**Files:** Rename folder, update imports in pages/components.

- [ ] **Step 1:** `git mv "src/app/(dashboard)" "src/app/(app)"`
- [ ] **Step 2:** Search and replace all `(dashboard)` references in TypeScript files. Run a grep first:
  ```bash
  grep -rn "(dashboard)" src/
  ```
  Likely matches in: component imports inside `[id]/page.tsx` paths use relative imports, so usually unaffected. If any explicit path string references `(dashboard)`, fix it.
- [ ] **Step 3:** Move shared UI/feature components from `src/app/(app)/_components/` to `src/components/`:
  ```bash
  mkdir -p src/components/ui src/components/features
  git mv "src/app/(app)/_components"/{button.tsx,input.tsx,empty-state.tsx,skeleton.tsx,filter-bar.tsx,search-input.tsx,badge.tsx,panel.tsx,stat-card.tsx} src/components/ui/ 2>/dev/null || true
  git mv "src/app/(app)/_components"/{patient-card.tsx,record-card.tsx,session-row.tsx,workflow-step.tsx,queue-item.tsx,compliance-item.tsx} src/components/features/ 2>/dev/null || true
  git mv "src/app/(app)/_components/sidebar.tsx" src/components/features/sidebar.tsx 2>/dev/null || true
  git mv "src/app/(app)/_components/header.tsx" src/components/features/header.tsx 2>/dev/null || true
  git mv "src/app/(app)/_components/mobile-nav.tsx" src/components/features/mobile-nav.tsx 2>/dev/null || true
  ```
  (Files that don't exist will skip via `|| true`.)
- [ ] **Step 4:** Update all relative imports `./_components/x` and `../_components/x` to `@/components/ui/x` or `@/components/features/x`. Run a sed-style edit per file or use the editor's project-wide rename.
- [ ] **Step 5:** Run `npm run build`. Expected: passes. Fix any broken imports it reports.
- [ ] **Step 6:** Commit `refactor: move (dashboard) to (app); extract components to src/components`.

---

### Task 4.2: Verify protected routes flow end-to-end

- [ ] **Step 1:** Start dev: `npm run dev`. Confirm `/login` works.
- [ ] **Step 2:** Logout, ensure `/` redirects to `/login?next=%2F`.
- [ ] **Step 3:** Log in, confirm sidebar links to `/agenda`, `/pacientes`, `/prontuarios`, `/financeiro`, `/compliance` (no `/whatsapp`).
- [ ] **Step 4:** No commit.

---

## Phase 5 — Patient CRUD with real DB

### Task 5.1: `createPatient` Server Action + integration test

**Files:** Create `src/server/actions/patient/createPatient.ts`, `tests/integration/patient/createPatient.test.ts`.

- [ ] **Step 1:** Write integration test:
  ```ts
  import { beforeEach, describe, expect, test } from "vitest";
  import { resetDb, testPrisma } from "../../helpers/db";
  import { hashPassword } from "@/lib/password";

  describe("createPatient (integration)", () => {
    let userId: string;
    beforeEach(async () => {
      await resetDb();
      const u = await testPrisma.user.create({
        data: { email: "u@t", passwordHash: await hashPassword("Abcdef12!"), name: "U", crp: "CRP" },
      });
      userId = u.id;
    });

    test("creates a patient owned by the user", async () => {
      const { createPatientForUser } = await import("@/server/actions/patient/createPatient");
      const r = await createPatientForUser(userId, {
        name: "Ana Ribeiro",
        modality: "online",
      });
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.userId).toBe(userId);
        expect(r.data.name).toBe("Ana Ribeiro");
      }
    });

    test("rejects too short name", async () => {
      const { createPatientForUser } = await import("@/server/actions/patient/createPatient");
      const r = await createPatientForUser(userId, { name: "X", modality: "online" });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.fieldErrors?.name).toBeDefined();
    });

    test("turns empty email/whatsapp into null", async () => {
      const { createPatientForUser } = await import("@/server/actions/patient/createPatient");
      const r = await createPatientForUser(userId, {
        name: "Ana", modality: "online", email: "", whatsapp: "",
      });
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.email).toBeNull();
        expect(r.data.whatsapp).toBeNull();
      }
    });
  });
  ```
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Create `src/server/actions/patient/createPatient.ts`:
  ```ts
  "use server";

  import { prisma } from "@/lib/db";
  import { requireUser } from "@/lib/auth-helpers";
  import { createPatientSchema, type CreatePatientInput } from "@/lib/validators/patient";
  import { actionOk, fromZodError, type ActionResult } from "@/lib/action-result";
  import { revalidatePath } from "next/cache";
  import type { Patient } from "@prisma/client";

  /** Pure function used by tests (no session). */
  export async function createPatientForUser(
    userId: string,
    input: CreatePatientInput,
  ): Promise<ActionResult<Patient>> {
    const parsed = createPatientSchema.safeParse(input);
    if (!parsed.success) return fromZodError(parsed.error);

    const patient = await prisma.patient.create({
      data: {
        userId,
        name: parsed.data.name,
        email: parsed.data.email ?? null,
        whatsapp: parsed.data.whatsapp ?? null,
        birthDate: parsed.data.birthDate,
        modality: parsed.data.modality,
        generalNotes: parsed.data.generalNotes,
      },
    });
    return actionOk(patient);
  }

  /** Server Action used by client forms. */
  export async function createPatient(input: CreatePatientInput): Promise<ActionResult<Patient>> {
    const user = await requireUser();
    const r = await createPatientForUser(user.id, input);
    if (r.ok) revalidatePath("/pacientes");
    return r;
  }
  ```
- [ ] **Step 4:** Run tests. Expected: 3 PASS.
- [ ] **Step 5:** Commit `feat(patient): createPatient action with tests`.

---

### Task 5.2: Patient queries

**Files:** Create `src/server/queries/patient.ts`, `tests/integration/patient/queries.test.ts`.

- [ ] **Step 1:** Write integration test:
  ```ts
  import { beforeEach, describe, expect, test } from "vitest";
  import { resetDb, testPrisma } from "../../helpers/db";
  import { hashPassword } from "@/lib/password";

  describe("patient queries", () => {
    let userId: string;
    beforeEach(async () => {
      await resetDb();
      const u = await testPrisma.user.create({
        data: { email: "u@t", passwordHash: await hashPassword("Abcdef12!"), name: "U", crp: "CRP" },
      });
      userId = u.id;
      await testPrisma.patient.createMany({
        data: [
          { userId, name: "Ana", modality: "online" },
          { userId, name: "Bruno", modality: "presencial" },
          { userId, name: "Cláudia", modality: "online", archived: true },
        ],
      });
    });

    test("listPatients returns only non-archived by default", async () => {
      const { listPatients } = await import("@/server/queries/patient");
      const r = await listPatients(userId, {});
      expect(r.length).toBe(2);
      expect(r.map((p) => p.name).sort()).toEqual(["Ana", "Bruno"]);
    });

    test("listPatients supports search", async () => {
      const { listPatients } = await import("@/server/queries/patient");
      const r = await listPatients(userId, { search: "ana" });
      expect(r.length).toBe(1);
      expect(r[0].name).toBe("Ana");
    });

    test("getPatient returns null for wrong user", async () => {
      const other = await testPrisma.user.create({
        data: { email: "x@t", passwordHash: "x", name: "X", crp: "X" },
      });
      const ana = await testPrisma.patient.findFirst({ where: { name: "Ana" } });
      const { getPatient } = await import("@/server/queries/patient");
      const r = await getPatient(other.id, ana!.id);
      expect(r).toBeNull();
    });

    test("countActivePatients returns 2", async () => {
      const { countActivePatients } = await import("@/server/queries/patient");
      expect(await countActivePatients(userId)).toBe(2);
    });
  });
  ```
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Create `src/server/queries/patient.ts`:
  ```ts
  import { prisma } from "@/lib/db";
  import type { Patient } from "@prisma/client";

  export async function listPatients(
    userId: string,
    opts: { search?: string; includeArchived?: boolean } = {},
  ): Promise<Patient[]> {
    return prisma.patient.findMany({
      where: {
        userId,
        archived: opts.includeArchived ? undefined : false,
        ...(opts.search
          ? {
              OR: [
                { name: { contains: opts.search, mode: "insensitive" } },
                { email: { contains: opts.search, mode: "insensitive" } },
                { whatsapp: { contains: opts.search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { name: "asc" },
    });
  }

  export async function getPatient(userId: string, id: string): Promise<Patient | null> {
    return prisma.patient.findFirst({ where: { id, userId } });
  }

  export async function countActivePatients(userId: string): Promise<number> {
    return prisma.patient.count({ where: { userId, archived: false } });
  }
  ```
- [ ] **Step 4:** Run tests. Expected: 4 PASS.
- [ ] **Step 5:** Commit `feat(patient): list/get/count queries with ownership checks`.

---

### Task 5.3: Update + archive Patient Server Actions

**Files:** Create `src/server/actions/patient/updatePatient.ts`, `archivePatient.ts` and integration tests.

- [ ] **Step 1:** Tests in `tests/integration/patient/update-archive.test.ts`:
  ```ts
  import { beforeEach, describe, expect, test } from "vitest";
  import { resetDb, testPrisma } from "../../helpers/db";
  import { hashPassword } from "@/lib/password";

  describe("updatePatient / archivePatient", () => {
    let userId: string;
    let patientId: string;

    beforeEach(async () => {
      await resetDb();
      const u = await testPrisma.user.create({
        data: { email: "u@t", passwordHash: await hashPassword("Abcdef12!"), name: "U", crp: "CRP" },
      });
      userId = u.id;
      const p = await testPrisma.patient.create({
        data: { userId, name: "Ana", modality: "online" },
      });
      patientId = p.id;
    });

    test("updates name", async () => {
      const { updatePatientForUser } = await import("@/server/actions/patient/updatePatient");
      const r = await updatePatientForUser(userId, { id: patientId, name: "Ana Ribeiro" });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.name).toBe("Ana Ribeiro");
    });

    test("rejects updating another user's patient", async () => {
      const other = await testPrisma.user.create({
        data: { email: "x@t", passwordHash: "x", name: "X", crp: "X" },
      });
      const { updatePatientForUser } = await import("@/server/actions/patient/updatePatient");
      const r = await updatePatientForUser(other.id, { id: patientId, name: "Hack" });
      expect(r.ok).toBe(false);
    });

    test("archive toggles flag", async () => {
      const { archivePatientForUser } = await import("@/server/actions/patient/archivePatient");
      const a = await archivePatientForUser(userId, { id: patientId, archived: true });
      expect(a.ok).toBe(true);
      if (a.ok) expect(a.data.archived).toBe(true);
      const b = await archivePatientForUser(userId, { id: patientId, archived: false });
      if (b.ok) expect(b.data.archived).toBe(false);
    });
  });
  ```
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Create `src/server/actions/patient/updatePatient.ts`:
  ```ts
  "use server";

  import { prisma } from "@/lib/db";
  import { requireUser } from "@/lib/auth-helpers";
  import { updatePatientSchema, type UpdatePatientInput } from "@/lib/validators/patient";
  import { actionError, actionOk, fromZodError, type ActionResult } from "@/lib/action-result";
  import { revalidatePath } from "next/cache";
  import type { Patient } from "@prisma/client";

  export async function updatePatientForUser(
    userId: string,
    input: UpdatePatientInput,
  ): Promise<ActionResult<Patient>> {
    const parsed = updatePatientSchema.safeParse(input);
    if (!parsed.success) return fromZodError(parsed.error);

    const owns = await prisma.patient.findFirst({ where: { id: parsed.data.id, userId } });
    if (!owns) return actionError("Paciente não encontrado.");

    const { id, ...data } = parsed.data;
    const patient = await prisma.patient.update({
      where: { id },
      data: {
        ...data,
        email: data.email ?? null,
        whatsapp: data.whatsapp ?? null,
      },
    });
    return actionOk(patient);
  }

  export async function updatePatient(input: UpdatePatientInput): Promise<ActionResult<Patient>> {
    const user = await requireUser();
    const r = await updatePatientForUser(user.id, input);
    if (r.ok) {
      revalidatePath("/pacientes");
      revalidatePath(`/pacientes/${r.data.id}`);
    }
    return r;
  }
  ```
- [ ] **Step 4:** Create `src/server/actions/patient/archivePatient.ts`:
  ```ts
  "use server";

  import { prisma } from "@/lib/db";
  import { requireUser } from "@/lib/auth-helpers";
  import { archivePatientSchema } from "@/lib/validators/patient";
  import { actionError, actionOk, fromZodError, type ActionResult } from "@/lib/action-result";
  import { revalidatePath } from "next/cache";
  import type { Patient } from "@prisma/client";

  export async function archivePatientForUser(
    userId: string,
    input: unknown,
  ): Promise<ActionResult<Patient>> {
    const parsed = archivePatientSchema.safeParse(input);
    if (!parsed.success) return fromZodError(parsed.error);

    const owns = await prisma.patient.findFirst({ where: { id: parsed.data.id, userId } });
    if (!owns) return actionError("Paciente não encontrado.");

    const patient = await prisma.patient.update({
      where: { id: parsed.data.id },
      data: { archived: parsed.data.archived },
    });
    return actionOk(patient);
  }

  export async function archivePatient(input: unknown): Promise<ActionResult<Patient>> {
    const user = await requireUser();
    const r = await archivePatientForUser(user.id, input);
    if (r.ok) revalidatePath("/pacientes");
    return r;
  }
  ```
- [ ] **Step 5:** Run tests. Expected: 3 PASS.
- [ ] **Step 6:** Commit `feat(patient): update + archive actions with ownership checks`.

---

### Task 5.4: `PatientForm` component

**Files:** Create `src/components/features/PatientForm.tsx`, `tests/components/PatientForm.test.tsx`.

- [ ] **Step 1:** Write component test:
  ```tsx
  import { describe, expect, test, vi } from "vitest";
  import { render, screen } from "@testing-library/react";
  import userEvent from "@testing-library/user-event";
  import { PatientForm } from "@/components/features/PatientForm";

  describe("PatientForm", () => {
    test("submits with valid input", async () => {
      const onSubmit = vi.fn().mockResolvedValue({ ok: true, data: { id: "x", name: "Ana" } });
      render(<PatientForm onSubmit={onSubmit} />);
      await userEvent.type(screen.getByLabelText(/nome/i), "Ana Ribeiro");
      await userEvent.click(screen.getByRole("button", { name: /salvar/i }));
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: "Ana Ribeiro", modality: "online" }));
    });

    test("shows server-side fieldErrors", async () => {
      const onSubmit = vi.fn().mockResolvedValue({
        ok: false,
        error: "Dados inválidos.",
        fieldErrors: { name: ["Nome muito curto"] },
      });
      render(<PatientForm onSubmit={onSubmit} />);
      await userEvent.type(screen.getByLabelText(/nome/i), "X");
      await userEvent.click(screen.getByRole("button", { name: /salvar/i }));
      expect(await screen.findByText("Nome muito curto")).toBeInTheDocument();
    });
  });
  ```
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Create `src/components/features/PatientForm.tsx`:
  ```tsx
  "use client";

  import { useState, useTransition } from "react";
  import type { ActionResult } from "@/lib/action-result";
  import type { CreatePatientInput } from "@/lib/validators/patient";

  type Props = {
    defaultValues?: Partial<CreatePatientInput>;
    onSubmit: (input: CreatePatientInput) => Promise<ActionResult<unknown>>;
    onCancel?: () => void;
    submitLabel?: string;
  };

  export function PatientForm({ defaultValues, onSubmit, onCancel, submitLabel = "Salvar" }: Props) {
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [topError, setTopError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    function handle(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault();
      setErrors({});
      setTopError(null);
      const fd = new FormData(e.currentTarget);
      const input: CreatePatientInput = {
        name: String(fd.get("name") ?? "").trim(),
        email: (String(fd.get("email") ?? "").trim() || undefined) as string | undefined,
        whatsapp: (String(fd.get("whatsapp") ?? "").trim() || undefined) as string | undefined,
        modality: String(fd.get("modality") ?? "online") as "online" | "presencial",
        generalNotes: String(fd.get("generalNotes") ?? "").trim() || undefined,
      };
      startTransition(async () => {
        const r = await onSubmit(input);
        if (!r.ok) {
          setErrors(r.fieldErrors ?? {});
          setTopError(r.error);
        }
      });
    }

    return (
      <form onSubmit={handle} className="space-y-4">
        <Field label="Nome" name="name" required defaultValue={defaultValues?.name} error={errors.name?.[0]} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Email" name="email" type="email" defaultValue={defaultValues?.email} error={errors.email?.[0]} />
          <Field label="WhatsApp" name="whatsapp" placeholder="+5511999999999" defaultValue={defaultValues?.whatsapp} error={errors.whatsapp?.[0]} />
        </div>
        <SelectField
          label="Modalidade"
          name="modality"
          defaultValue={defaultValues?.modality ?? "online"}
          options={[
            { value: "online", label: "Online" },
            { value: "presencial", label: "Presencial" },
          ]}
          error={errors.modality?.[0]}
        />
        <TextArea label="Observações gerais" name="generalNotes" defaultValue={defaultValues?.generalNotes} error={errors.generalNotes?.[0]} />

        {topError ? (
          <div role="alert" className="rounded-md border border-[#f3bcbc] bg-[var(--danger-soft)] p-3 text-[13px] text-[var(--danger-text)]">
            {topError}
          </div>
        ) : null}

        <div className="flex justify-end gap-2">
          {onCancel ? (
            <button type="button" onClick={onCancel} className="btn btn-ghost">Cancelar</button>
          ) : null}
          <button type="submit" disabled={pending} className="btn btn-primary">
            {pending ? "Salvando..." : submitLabel}
          </button>
        </div>
      </form>
    );
  }

  function Field(props: {
    label: string; name: string; type?: string; required?: boolean;
    placeholder?: string; defaultValue?: string; error?: string;
  }) {
    return (
      <div>
        <label htmlFor={props.name} className="label-strong block mb-1">{props.label}</label>
        <input
          id={props.name}
          name={props.name}
          type={props.type ?? "text"}
          required={props.required}
          placeholder={props.placeholder}
          defaultValue={props.defaultValue}
          className="input"
          aria-invalid={!!props.error}
        />
        {props.error ? <p className="mt-1 text-[12px] text-[var(--danger)]">{props.error}</p> : null}
      </div>
    );
  }

  function SelectField(props: {
    label: string; name: string; defaultValue: string;
    options: { value: string; label: string }[]; error?: string;
  }) {
    return (
      <div>
        <label htmlFor={props.name} className="label-strong block mb-1">{props.label}</label>
        <select id={props.name} name={props.name} defaultValue={props.defaultValue} className="input">
          {props.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {props.error ? <p className="mt-1 text-[12px] text-[var(--danger)]">{props.error}</p> : null}
      </div>
    );
  }

  function TextArea(props: { label: string; name: string; defaultValue?: string; error?: string }) {
    return (
      <div>
        <label htmlFor={props.name} className="label-strong block mb-1">{props.label}</label>
        <textarea
          id={props.name}
          name={props.name}
          defaultValue={props.defaultValue}
          rows={3}
          className="input min-h-[88px] py-2 leading-snug"
        />
        {props.error ? <p className="mt-1 text-[12px] text-[var(--danger)]">{props.error}</p> : null}
      </div>
    );
  }
  ```
- [ ] **Step 4:** Run component test. Expected: PASS.
- [ ] **Step 5:** Commit `feat(patient): PatientForm component with field-level errors`.

---

### Task 5.5: Migrate `/pacientes` listing to DB

**Files:** Modify `src/app/(app)/pacientes/page.tsx`. Create `src/app/(app)/pacientes/_components/PatientList.tsx` and `NewPatientDrawer.tsx`.

- [ ] **Step 1:** Replace `src/app/(app)/pacientes/page.tsx`:
  ```tsx
  import { requireUser } from "@/lib/auth-helpers";
  import { listPatients } from "@/server/queries/patient";
  import { PatientList } from "./_components/PatientList";

  export const dynamic = "force-dynamic";

  export default async function PacientesPage({
    searchParams,
  }: {
    searchParams: Promise<{ q?: string }>;
  }) {
    const user = await requireUser();
    const { q = "" } = await searchParams;
    const patients = await listPatients(user.id, { search: q });

    return (
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
        <PatientList patients={patients} initialSearch={q} />
      </div>
    );
  }
  ```
- [ ] **Step 2:** Create `src/app/(app)/pacientes/_components/PatientList.tsx`:
  ```tsx
  "use client";

  import { useState, useTransition } from "react";
  import { useRouter } from "next/navigation";
  import type { Patient } from "@prisma/client";
  import { PatientCard } from "@/components/features/patient-card";
  import { SearchInput } from "@/components/ui/search-input";
  import { EmptyState } from "@/components/ui/empty-state";
  import { UsersRound } from "lucide-react";
  import { NewPatientDrawer } from "./NewPatientDrawer";

  export function PatientList({ patients, initialSearch }: { patients: Patient[]; initialSearch: string }) {
    const [search, setSearch] = useState(initialSearch);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const router = useRouter();
    const [, startTransition] = useTransition();

    function onSearch(v: string) {
      setSearch(v);
      startTransition(() => {
        const url = new URL(window.location.href);
        if (v) url.searchParams.set("q", v); else url.searchParams.delete("q");
        router.replace(url.pathname + url.search);
      });
    }

    return (
      <>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="label">Pacientes</p>
            <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-[var(--ink)]">
              Lista de pacientes
            </h2>
            <p className="mt-1 text-[13px] text-[var(--ink-4)]">
              {patients.length} {patients.length === 1 ? "paciente em acompanhamento" : "pacientes em acompanhamento"}
            </p>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => setDrawerOpen(true)}>
            + Adicionar paciente
          </button>
        </div>

        <div className="mb-4 max-w-md">
          <SearchInput placeholder="Buscar por nome, email ou whatsapp..." value={search} onChange={onSearch} />
        </div>

        {patients.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            title={search ? "Nenhum paciente encontrado" : "Você ainda não tem pacientes"}
            description={search ? "Tente outro termo." : "Adicione seu primeiro paciente para começar."}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {patients.map((p) => (
              <PatientCard key={p.id} patient={p} />
            ))}
          </div>
        )}

        <NewPatientDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </>
    );
  }
  ```
- [ ] **Step 3:** Create `src/app/(app)/pacientes/_components/NewPatientDrawer.tsx`:
  ```tsx
  "use client";

  import { useRouter } from "next/navigation";
  import { PatientForm } from "@/components/features/PatientForm";
  import { createPatient } from "@/server/actions/patient/createPatient";

  export function NewPatientDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
    const router = useRouter();
    if (!open) return null;
    return (
      <>
        <div className="fixed inset-0 z-40 bg-[var(--ink)]/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
        <aside
          role="dialog"
          aria-labelledby="new-patient-title"
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-[var(--surface)] shadow-[var(--shadow-pop)]"
        >
          <header className="border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
            <h2 id="new-patient-title" className="h-section">Novo paciente</h2>
            <button onClick={onClose} className="btn btn-ghost btn-sm">Fechar</button>
          </header>
          <div className="flex-1 overflow-y-auto p-6">
            <PatientForm
              submitLabel="Adicionar"
              onSubmit={async (input) => {
                const r = await createPatient(input);
                if (r.ok) {
                  onClose();
                  router.refresh();
                }
                return r;
              }}
              onCancel={onClose}
            />
          </div>
        </aside>
      </>
    );
  }
  ```
- [ ] **Step 4:** Make sure `PatientCard` works with a real `Patient` (no longer needs the mock fields like `lastContactAt` — adjust to only show what's in the DB type). Update `src/components/features/patient-card.tsx` if it references mock-only fields.
- [ ] **Step 5:** Run `npm run build`. Expected: passes. Hit `/pacientes` in dev — list is empty, click "+ Adicionar" → drawer → fill name → submit → list shows new patient.
- [ ] **Step 6:** Commit `feat(patient): list page reads from DB; new patient drawer wired to createPatient`.

---

### Task 5.6: Migrate `/pacientes/[id]` to DB

**Files:** Modify `src/app/(app)/pacientes/[id]/page.tsx`.

- [ ] **Step 1:** Replace `src/app/(app)/pacientes/[id]/page.tsx`:
  ```tsx
  import { notFound } from "next/navigation";
  import Link from "next/link";
  import { ArrowLeft } from "lucide-react";
  import { requireUser } from "@/lib/auth-helpers";
  import { getPatient } from "@/server/queries/patient";
  import { Badge } from "@/components/ui/badge";
  import { Panel } from "@/components/ui/panel";
  import { formatDate, formatDateTime } from "@/lib/format/date";
  import { whatsappToWaMeLink } from "@/lib/format/phone";

  export const dynamic = "force-dynamic";

  export default async function PacienteDetalhePage({ params }: { params: Promise<{ id: string }> }) {
    const user = await requireUser();
    const { id } = await params;
    const patient = await getPatient(user.id, id);
    if (!patient) notFound();

    const initials = patient.name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("");

    return (
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
        <Link href="/pacientes" className="btn btn-ghost btn-sm -ml-2 mb-4 inline-flex">
          <ArrowLeft size={14} strokeWidth={1.8} /> Voltar para pacientes
        </Link>

        <header className="card mb-5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="flex size-14 items-center justify-center rounded-full bg-[var(--blue-soft)] text-[17px] font-semibold text-[var(--blue-text)]">
                {initials}
              </div>
              <div>
                <h1 className="h-page text-[22px]">{patient.name}</h1>
                <p className="mt-1 text-[13px] text-[var(--ink-4)]">
                  {patient.whatsapp ? (
                    <a href={whatsappToWaMeLink(patient.whatsapp)} target="_blank" rel="noreferrer" className="text-[var(--blue)] hover:underline">
                      {patient.whatsapp}
                    </a>
                  ) : "Sem WhatsApp"}
                  {patient.email ? <> · {patient.email}</> : null}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge variant={patient.modality === "online" ? "info" : "neutral"}>
                    {patient.modality === "online" ? "Online" : "Presencial"}
                  </Badge>
                  <Badge
                    variant={
                      patient.consentStatus === "complete" ? "success" :
                      patient.consentStatus === "expired" ? "danger" : "warning"
                    }
                  >
                    Consentimento {patient.consentStatus}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </header>

        <Panel eyebrow="Dados" title="Informações do paciente">
          <dl className="divide-y divide-[var(--border)]">
            {patient.birthDate ? <DataLine label="Nascimento" value={formatDate(patient.birthDate)} /> : null}
            <DataLine label="Modalidade" value={patient.modality} />
            <DataLine label="Criado em" value={formatDateTime(patient.createdAt)} />
            {patient.generalNotes ? <DataLine label="Observações" value={patient.generalNotes} /> : null}
          </dl>
        </Panel>

        <p className="mt-6 text-[13px] text-[var(--ink-4)]">
          Sessões, prontuários, anotações e financeiro serão exibidos aqui após as próximas tarefas do plano.
        </p>
      </div>
    );
  }

  function DataLine({ label, value }: { label: string; value: string }) {
    return (
      <div className="grid grid-cols-[120px_1fr] items-baseline gap-3 py-2.5">
        <dt className="label">{label}</dt>
        <dd className="text-[13.5px] font-medium text-[var(--ink-2)]">{value}</dd>
      </div>
    );
  }
  ```
- [ ] **Step 2:** Run `npm run build`. Click into a patient in dev — page renders with real data.
- [ ] **Step 3:** Commit `feat(patient): detail page reads from DB (tabs added in later phases)`.

---

## Phase 6 — Session CRUD

### Task 6.1: `createSession` with conflict detection + tests

**Files:** Create `src/server/actions/session/createSession.ts`, `tests/integration/session/createSession.test.ts`.

- [ ] **Step 1:** Tests:
  ```ts
  import { beforeEach, describe, expect, test } from "vitest";
  import { resetDb, testPrisma } from "../../helpers/db";
  import { hashPassword } from "@/lib/password";

  describe("createSession (integration)", () => {
    let userId: string;
    let patientId: string;

    beforeEach(async () => {
      await resetDb();
      const u = await testPrisma.user.create({
        data: { email: "u@t", passwordHash: await hashPassword("Abcdef12!"), name: "U", crp: "CRP" },
      });
      userId = u.id;
      const p = await testPrisma.patient.create({
        data: { userId, name: "Ana", modality: "online" },
      });
      patientId = p.id;
    });

    test("creates session and matching billing entry", async () => {
      const { createSessionForUser } = await import("@/server/actions/session/createSession");
      const r = await createSessionForUser(userId, {
        patientId,
        startsAt: new Date("2026-05-20T10:00:00-03:00"),
        endsAt: new Date("2026-05-20T10:50:00-03:00"),
        modality: "online",
        location: "Link",
        serviceType: "Psicoterapia",
        amountCents: 20000,
      });
      expect(r.ok).toBe(true);
      if (r.ok) {
        const billing = await testPrisma.billingEntry.findFirst({ where: { sessionId: r.data.id } });
        expect(billing).not.toBeNull();
        expect(billing!.amountCents).toBe(20000);
      }
    });

    test("rejects overlapping sessions for same psychologist", async () => {
      const { createSessionForUser } = await import("@/server/actions/session/createSession");
      const base = {
        patientId,
        modality: "online" as const,
        location: "Link",
        serviceType: "Psicoterapia",
        amountCents: 20000,
      };
      const a = await createSessionForUser(userId, {
        ...base,
        startsAt: new Date("2026-05-20T10:00:00-03:00"),
        endsAt: new Date("2026-05-20T10:50:00-03:00"),
      });
      expect(a.ok).toBe(true);

      const b = await createSessionForUser(userId, {
        ...base,
        startsAt: new Date("2026-05-20T10:30:00-03:00"),
        endsAt: new Date("2026-05-20T11:20:00-03:00"),
      });
      expect(b.ok).toBe(false);
      if (!b.ok) expect(b.error).toMatch(/sobreposi|conflito/i);
    });

    test("rejects endsAt <= startsAt", async () => {
      const { createSessionForUser } = await import("@/server/actions/session/createSession");
      const r = await createSessionForUser(userId, {
        patientId,
        startsAt: new Date("2026-05-20T10:00:00-03:00"),
        endsAt: new Date("2026-05-20T10:00:00-03:00"),
        modality: "online",
        location: "Link",
        serviceType: "Psicoterapia",
        amountCents: 20000,
      });
      expect(r.ok).toBe(false);
    });
  });
  ```
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Create `src/server/actions/session/createSession.ts`:
  ```ts
  "use server";

  import { prisma } from "@/lib/db";
  import { requireUser } from "@/lib/auth-helpers";
  import { createSessionSchema, type CreateSessionInput } from "@/lib/validators/session";
  import { actionError, actionOk, fromZodError, type ActionResult } from "@/lib/action-result";
  import { revalidatePath } from "next/cache";
  import type { TherapySession } from "@prisma/client";

  export async function createSessionForUser(
    userId: string,
    input: CreateSessionInput,
  ): Promise<ActionResult<TherapySession>> {
    const parsed = createSessionSchema.safeParse(input);
    if (!parsed.success) return fromZodError(parsed.error);
    const data = parsed.data;

    const owns = await prisma.patient.findFirst({ where: { id: data.patientId, userId } });
    if (!owns) return actionError("Paciente não encontrado.");

    const overlap = await prisma.therapySession.findFirst({
      where: {
        userId,
        status: { notIn: ["CANCELADA", "NAO_COMPARECEU"] },
        startsAt: { lt: data.endsAt },
        endsAt: { gt: data.startsAt },
      },
    });
    if (overlap) return actionError("Conflito de horário com outra sessão.");

    const session = await prisma.$transaction(async (tx) => {
      const s = await tx.therapySession.create({
        data: {
          userId,
          patientId: data.patientId,
          startsAt: data.startsAt,
          endsAt: data.endsAt,
          modality: data.modality,
          location: data.location,
          serviceType: data.serviceType,
          amountCents: data.amountCents,
          notes: data.notes,
        },
      });
      await tx.billingEntry.create({
        data: {
          userId,
          patientId: data.patientId,
          sessionId: s.id,
          amountCents: data.amountCents,
          serviceType: data.serviceType,
          serviceDate: data.startsAt,
        },
      });
      return s;
    });

    return actionOk(session);
  }

  export async function createSession(input: CreateSessionInput): Promise<ActionResult<TherapySession>> {
    const user = await requireUser();
    const r = await createSessionForUser(user.id, input);
    if (r.ok) {
      revalidatePath("/agenda");
      revalidatePath("/");
    }
    return r;
  }
  ```
- [ ] **Step 4:** Run tests. Expected: 3 PASS.
- [ ] **Step 5:** Commit `feat(session): createSession with conflict detection + auto billing`.

---

### Task 6.2: `confirmSession`, `markAttendance`, `cancelSession` actions

**Files:** Create `src/server/actions/session/{confirmSession,markAttendance,cancelSession}.ts`, `tests/integration/session/status-changes.test.ts`.

- [ ] **Step 1:** Tests:
  ```ts
  import { beforeEach, describe, expect, test } from "vitest";
  import { resetDb, testPrisma } from "../../helpers/db";
  import { hashPassword } from "@/lib/password";

  describe("session status changes", () => {
    let userId: string;
    let sessionId: string;

    beforeEach(async () => {
      await resetDb();
      const u = await testPrisma.user.create({
        data: { email: "u@t", passwordHash: await hashPassword("Abcdef12!"), name: "U", crp: "CRP" },
      });
      userId = u.id;
      const p = await testPrisma.patient.create({ data: { userId, name: "Ana", modality: "online" } });
      const s = await testPrisma.therapySession.create({
        data: {
          userId, patientId: p.id,
          startsAt: new Date("2026-05-20T10:00:00-03:00"),
          endsAt: new Date("2026-05-20T10:50:00-03:00"),
          modality: "online", location: "Link", amountCents: 20000,
        },
      });
      sessionId = s.id;
    });

    test("confirm flips confirmationStatus to confirmed", async () => {
      const { confirmSessionForUser } = await import("@/server/actions/session/confirmSession");
      const r = await confirmSessionForUser(userId, { id: sessionId });
      if (r.ok) expect(r.data.confirmationStatus).toBe("confirmed");
    });

    test("markAttendance present sets status CONCLUIDA", async () => {
      const { markAttendanceForUser } = await import("@/server/actions/session/markAttendance");
      const r = await markAttendanceForUser(userId, { id: sessionId, attendanceStatus: "present" });
      if (r.ok) {
        expect(r.data.attendanceStatus).toBe("present");
        expect(r.data.status).toBe("CONCLUIDA");
      }
    });

    test("markAttendance missed sets status NAO_COMPARECEU", async () => {
      const { markAttendanceForUser } = await import("@/server/actions/session/markAttendance");
      const r = await markAttendanceForUser(userId, { id: sessionId, attendanceStatus: "missed" });
      if (r.ok) expect(r.data.status).toBe("NAO_COMPARECEU");
    });

    test("cancel sets CANCELADA and stores reason in notes", async () => {
      const { cancelSessionForUser } = await import("@/server/actions/session/cancelSession");
      const r = await cancelSessionForUser(userId, { id: sessionId, reason: "Paciente pediu" });
      if (r.ok) {
        expect(r.data.status).toBe("CANCELADA");
        expect(r.data.notes).toMatch(/Paciente pediu/);
      }
    });
  });
  ```
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Create `src/server/actions/session/confirmSession.ts`:
  ```ts
  "use server";

  import { prisma } from "@/lib/db";
  import { requireUser } from "@/lib/auth-helpers";
  import { confirmSessionSchema } from "@/lib/validators/session";
  import { actionError, actionOk, fromZodError, type ActionResult } from "@/lib/action-result";
  import { revalidatePath } from "next/cache";
  import type { TherapySession } from "@prisma/client";

  export async function confirmSessionForUser(userId: string, input: unknown): Promise<ActionResult<TherapySession>> {
    const parsed = confirmSessionSchema.safeParse(input);
    if (!parsed.success) return fromZodError(parsed.error);
    const owns = await prisma.therapySession.findFirst({ where: { id: parsed.data.id, userId } });
    if (!owns) return actionError("Sessão não encontrada.");
    const updated = await prisma.therapySession.update({
      where: { id: parsed.data.id },
      data: { confirmationStatus: "confirmed" },
    });
    return actionOk(updated);
  }

  export async function confirmSession(input: unknown): Promise<ActionResult<TherapySession>> {
    const user = await requireUser();
    const r = await confirmSessionForUser(user.id, input);
    if (r.ok) revalidatePath("/");
    return r;
  }
  ```
- [ ] **Step 4:** Create `src/server/actions/session/markAttendance.ts`:
  ```ts
  "use server";

  import { prisma } from "@/lib/db";
  import { requireUser } from "@/lib/auth-helpers";
  import { markAttendanceSchema } from "@/lib/validators/session";
  import { actionError, actionOk, fromZodError, type ActionResult } from "@/lib/action-result";
  import { revalidatePath } from "next/cache";
  import type { TherapySession, SessionStatus } from "@prisma/client";

  const statusFor: Record<"present" | "missed" | "excused", SessionStatus> = {
    present: "CONCLUIDA",
    missed: "NAO_COMPARECEU",
    excused: "CANCELADA",
  };

  export async function markAttendanceForUser(userId: string, input: unknown): Promise<ActionResult<TherapySession>> {
    const parsed = markAttendanceSchema.safeParse(input);
    if (!parsed.success) return fromZodError(parsed.error);
    const owns = await prisma.therapySession.findFirst({ where: { id: parsed.data.id, userId } });
    if (!owns) return actionError("Sessão não encontrada.");
    const updated = await prisma.therapySession.update({
      where: { id: parsed.data.id },
      data: {
        attendanceStatus: parsed.data.attendanceStatus,
        status: statusFor[parsed.data.attendanceStatus],
      },
    });
    return actionOk(updated);
  }

  export async function markAttendance(input: unknown): Promise<ActionResult<TherapySession>> {
    const user = await requireUser();
    const r = await markAttendanceForUser(user.id, input);
    if (r.ok) {
      revalidatePath("/agenda");
      revalidatePath("/");
    }
    return r;
  }
  ```
- [ ] **Step 5:** Create `src/server/actions/session/cancelSession.ts`:
  ```ts
  "use server";

  import { prisma } from "@/lib/db";
  import { requireUser } from "@/lib/auth-helpers";
  import { cancelSessionSchema } from "@/lib/validators/session";
  import { actionError, actionOk, fromZodError, type ActionResult } from "@/lib/action-result";
  import { revalidatePath } from "next/cache";
  import type { TherapySession } from "@prisma/client";

  export async function cancelSessionForUser(userId: string, input: unknown): Promise<ActionResult<TherapySession>> {
    const parsed = cancelSessionSchema.safeParse(input);
    if (!parsed.success) return fromZodError(parsed.error);
    const owns = await prisma.therapySession.findFirst({ where: { id: parsed.data.id, userId } });
    if (!owns) return actionError("Sessão não encontrada.");
    const noteAppend = parsed.data.reason ? `\n[Cancelada] ${parsed.data.reason}` : "\n[Cancelada]";
    const updated = await prisma.therapySession.update({
      where: { id: parsed.data.id },
      data: {
        status: "CANCELADA",
        notes: (owns.notes ?? "") + noteAppend,
      },
    });
    return actionOk(updated);
  }

  export async function cancelSession(input: unknown): Promise<ActionResult<TherapySession>> {
    const user = await requireUser();
    const r = await cancelSessionForUser(user.id, input);
    if (r.ok) {
      revalidatePath("/agenda");
      revalidatePath("/");
    }
    return r;
  }
  ```
- [ ] **Step 6:** Run tests. Expected: 4 PASS.
- [ ] **Step 7:** Commit `feat(session): confirm, markAttendance, cancel actions`.

---

### Task 6.3: Session queries

**Files:** Create `src/server/queries/session.ts`, `tests/integration/session/queries.test.ts`.

- [ ] **Step 1:** Test:
  ```ts
  import { beforeEach, describe, expect, test } from "vitest";
  import { resetDb, testPrisma } from "../../helpers/db";
  import { hashPassword } from "@/lib/password";

  describe("session queries", () => {
    let userId: string;
    let patientId: string;

    beforeEach(async () => {
      await resetDb();
      const u = await testPrisma.user.create({
        data: { email: "u@t", passwordHash: await hashPassword("Abcdef12!"), name: "U", crp: "CRP" },
      });
      userId = u.id;
      const p = await testPrisma.patient.create({ data: { userId, name: "Ana", modality: "online" } });
      patientId = p.id;
      const base = { userId, patientId, modality: "online" as const, location: "Link", amountCents: 20000 };
      await testPrisma.therapySession.createMany({
        data: [
          { ...base, startsAt: new Date("2026-05-16T10:00:00-03:00"), endsAt: new Date("2026-05-16T10:50:00-03:00") },
          { ...base, startsAt: new Date("2026-05-16T15:00:00-03:00"), endsAt: new Date("2026-05-16T15:50:00-03:00") },
          { ...base, startsAt: new Date("2026-05-20T10:00:00-03:00"), endsAt: new Date("2026-05-20T10:50:00-03:00") },
        ],
      });
    });

    test("listSessionsOnDate returns sessions of that day", async () => {
      const { listSessionsOnDate } = await import("@/server/queries/session");
      const r = await listSessionsOnDate(userId, new Date("2026-05-16T00:00:00-03:00"));
      expect(r.length).toBe(2);
    });

    test("listSessionsInRange returns sessions within window", async () => {
      const { listSessionsInRange } = await import("@/server/queries/session");
      const r = await listSessionsInRange(
        userId,
        new Date("2026-05-16T00:00:00-03:00"),
        new Date("2026-05-21T00:00:00-03:00"),
      );
      expect(r.length).toBe(3);
    });

    test("listSessionsForPatient returns by patient", async () => {
      const { listSessionsForPatient } = await import("@/server/queries/session");
      const r = await listSessionsForPatient(userId, patientId);
      expect(r.length).toBe(3);
    });
  });
  ```
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Create `src/server/queries/session.ts`:
  ```ts
  import { prisma } from "@/lib/db";
  import type { TherapySession, Patient } from "@prisma/client";

  export type SessionWithPatient = TherapySession & { patient: Patient };

  function startOfDay(d: Date): Date {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }
  function endOfDay(d: Date): Date {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
  }

  export async function listSessionsOnDate(userId: string, date: Date): Promise<SessionWithPatient[]> {
    return prisma.therapySession.findMany({
      where: { userId, startsAt: { gte: startOfDay(date), lte: endOfDay(date) } },
      include: { patient: true },
      orderBy: { startsAt: "asc" },
    });
  }

  export async function listSessionsInRange(userId: string, from: Date, to: Date): Promise<SessionWithPatient[]> {
    return prisma.therapySession.findMany({
      where: { userId, startsAt: { gte: from, lt: to } },
      include: { patient: true },
      orderBy: { startsAt: "asc" },
    });
  }

  export async function listSessionsForPatient(userId: string, patientId: string): Promise<TherapySession[]> {
    return prisma.therapySession.findMany({
      where: { userId, patientId },
      orderBy: { startsAt: "desc" },
    });
  }

  export async function getSession(userId: string, id: string): Promise<SessionWithPatient | null> {
    return prisma.therapySession.findFirst({
      where: { id, userId },
      include: { patient: true },
    });
  }
  ```
- [ ] **Step 4:** Run tests. Expected: 3 PASS.
- [ ] **Step 5:** Commit `feat(session): list/get queries by date, range, patient`.

---

### Task 6.4: Migrate `/agenda` to DB + inline actions

**Files:** Replace `src/app/(app)/agenda/page.tsx`. Create `src/app/(app)/agenda/_components/AgendaView.tsx`, `SessionActions.tsx`, `NewSessionDrawer.tsx`.

- [ ] **Step 1:** Replace `src/app/(app)/agenda/page.tsx`:
  ```tsx
  import { requireUser } from "@/lib/auth-helpers";
  import { listSessionsInRange } from "@/server/queries/session";
  import { listPatients } from "@/server/queries/patient";
  import { AgendaView } from "./_components/AgendaView";

  export const dynamic = "force-dynamic";

  function rangeFor(period: string): { from: Date; to: Date } {
    const now = new Date();
    const from = new Date(now); from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    if (period === "Semana") to.setDate(to.getDate() + 7);
    else if (period === "Mês") to.setMonth(to.getMonth() + 1);
    else to.setDate(to.getDate() + 1);
    return { from, to };
  }

  export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
    const user = await requireUser();
    const { p = "Hoje" } = await searchParams;
    const { from, to } = rangeFor(p);
    const sessions = await listSessionsInRange(user.id, from, to);
    const patients = await listPatients(user.id, {});

    return (
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
        <AgendaView sessions={sessions} patients={patients} initialPeriod={p} defaultPriceCents={user.defaultSessionPriceCents} />
      </div>
    );
  }
  ```
- [ ] **Step 2:** Create `src/app/(app)/agenda/_components/SessionActions.tsx`:
  ```tsx
  "use client";

  import { useTransition } from "react";
  import { useRouter } from "next/navigation";
  import { confirmSession } from "@/server/actions/session/confirmSession";
  import { markAttendance } from "@/server/actions/session/markAttendance";

  export function SessionActions({ sessionId, confirmed }: { sessionId: string; confirmed: boolean }) {
    const router = useRouter();
    const [pending, start] = useTransition();

    function call(fn: () => Promise<unknown>) {
      start(async () => {
        await fn();
        router.refresh();
      });
    }

    return (
      <div className="flex gap-2">
        {!confirmed ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => call(() => confirmSession({ id: sessionId }))}
            className="btn btn-secondary btn-sm"
          >
            Confirmar
          </button>
        ) : null}
        <button
          type="button"
          disabled={pending}
          onClick={() => call(() => markAttendance({ id: sessionId, attendanceStatus: "present" }))}
          className="btn btn-primary btn-sm"
        >
          Marcar presença
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => call(() => markAttendance({ id: sessionId, attendanceStatus: "missed" }))}
          className="btn btn-ghost btn-sm"
        >
          Falta
        </button>
      </div>
    );
  }
  ```
- [ ] **Step 3:** Create `src/app/(app)/agenda/_components/AgendaView.tsx`:
  ```tsx
  "use client";

  import { useState } from "react";
  import { useRouter } from "next/navigation";
  import Link from "next/link";
  import type { Patient, TherapySession } from "@prisma/client";
  import { FilterBar } from "@/components/ui/filter-bar";
  import { EmptyState } from "@/components/ui/empty-state";
  import { Panel } from "@/components/ui/panel";
  import { Badge } from "@/components/ui/badge";
  import { formatTime } from "@/lib/format/date";
  import { CalendarDays } from "lucide-react";
  import { SessionActions } from "./SessionActions";
  import { NewSessionDrawer } from "./NewSessionDrawer";

  const PERIODS = ["Hoje", "Semana", "Mês"] as const;
  type SWP = TherapySession & { patient: Patient };

  export function AgendaView({
    sessions, patients, initialPeriod, defaultPriceCents,
  }: { sessions: SWP[]; patients: Patient[]; initialPeriod: string; defaultPriceCents: number }) {
    const router = useRouter();
    const [period, setPeriod] = useState(initialPeriod);
    const [drawerOpen, setDrawerOpen] = useState(false);

    function onPeriod(v: string) {
      setPeriod(v);
      const url = new URL(window.location.href);
      url.searchParams.set("p", v);
      router.replace(url.pathname + url.search);
    }

    return (
      <>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="label">Agenda</p>
            <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-[var(--ink)]">
              Sessões e confirmações
            </h2>
          </div>
          <div className="flex gap-2">
            <FilterBar options={PERIODS} selected={period} onChange={onPeriod} />
            <button type="button" className="btn btn-primary" onClick={() => setDrawerOpen(true)}>
              + Nova sessão
            </button>
          </div>
        </div>

        <Panel eyebrow="Período" title={period} icon={CalendarDays} padded={false}>
          {sessions.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={CalendarDays} title="Sem sessões no período" description="Crie uma nova sessão para começar." />
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {sessions.map((s) => (
                <article key={s.id} className="row-hover grid grid-cols-1 gap-3 px-5 py-4 lg:grid-cols-[78px_1.3fr_auto] lg:items-center">
                  <div>
                    <p className="metric-number text-[15px] font-semibold text-[var(--ink)]">
                      {formatTime(s.startsAt)}
                    </p>
                    <p className="mt-0.5 text-[11.5px] text-[var(--ink-5)]">
                      {s.modality === "online" ? "Online" : "Presencial"}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <Link href={`/agenda/${s.id}`} className="text-[14px] font-semibold text-[var(--ink)] hover:text-[var(--blue)]">
                      {s.patient.name}
                    </Link>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Badge variant={s.confirmationStatus === "confirmed" ? "success" : "warning"}>
                        {s.confirmationStatus === "confirmed" ? "Confirmada" : "Aguardando"}
                      </Badge>
                      <Badge variant={s.attendanceStatus === "present" ? "success" : s.attendanceStatus === "missed" ? "danger" : "neutral"}>
                        {{ expected: "Prevista", present: "Presente", missed: "Falta", excused: "Justificada" }[s.attendanceStatus]}
                      </Badge>
                      <Badge variant={s.paymentStatus === "PAGO" ? "success" : "warning"}>
                        {s.paymentStatus === "PAGO" ? "Pago" : "Pendente"}
                      </Badge>
                    </div>
                  </div>
                  <SessionActions sessionId={s.id} confirmed={s.confirmationStatus === "confirmed"} />
                </article>
              ))}
            </div>
          )}
        </Panel>

        <NewSessionDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          patients={patients}
          defaultPriceCents={defaultPriceCents}
        />
      </>
    );
  }
  ```
- [ ] **Step 4:** Create `src/app/(app)/agenda/_components/NewSessionDrawer.tsx`:
  ```tsx
  "use client";

  import { useState, useTransition } from "react";
  import { useRouter } from "next/navigation";
  import type { Patient } from "@prisma/client";
  import { createSession } from "@/server/actions/session/createSession";

  export function NewSessionDrawer({
    open, onClose, patients, defaultPriceCents,
  }: { open: boolean; onClose: () => void; patients: Patient[]; defaultPriceCents: number }) {
    const router = useRouter();
    const [pending, start] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

    if (!open) return null;

    function onSubmit(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault();
      setError(null);
      setFieldErrors({});
      const fd = new FormData(e.currentTarget);
      const date = String(fd.get("date") ?? "");
      const startTime = String(fd.get("startTime") ?? "");
      const endTime = String(fd.get("endTime") ?? "");
      const startsAt = new Date(`${date}T${startTime}:00-03:00`);
      const endsAt = new Date(`${date}T${endTime}:00-03:00`);
      const amount = Number(fd.get("amount") ?? defaultPriceCents / 100);
      start(async () => {
        const r = await createSession({
          patientId: String(fd.get("patientId") ?? ""),
          startsAt, endsAt,
          modality: String(fd.get("modality") ?? "online") as "online" | "presencial",
          location: String(fd.get("location") ?? ""),
          serviceType: String(fd.get("serviceType") ?? "Psicoterapia individual"),
          amountCents: Math.round(amount * 100),
        });
        if (r.ok) {
          onClose();
          router.refresh();
        } else {
          setError(r.error);
          setFieldErrors(r.fieldErrors ?? {});
        }
      });
    }

    return (
      <>
        <div className="fixed inset-0 z-40 bg-[var(--ink)]/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
        <aside role="dialog" aria-labelledby="new-session-title" className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-[var(--surface)] shadow-[var(--shadow-pop)]">
          <header className="border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
            <h2 id="new-session-title" className="h-section">Nova sessão</h2>
            <button onClick={onClose} className="btn btn-ghost btn-sm">Fechar</button>
          </header>
          <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
              <label htmlFor="patientId" className="label-strong block mb-1">Paciente</label>
              <select id="patientId" name="patientId" required className="input">
                <option value="">Selecione...</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {fieldErrors.patientId ? <p className="mt-1 text-[12px] text-[var(--danger)]">{fieldErrors.patientId[0]}</p> : null}
            </div>
            <div>
              <label htmlFor="date" className="label-strong block mb-1">Data</label>
              <input id="date" name="date" type="date" required className="input" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="startTime" className="label-strong block mb-1">Início</label>
                <input id="startTime" name="startTime" type="time" required className="input" />
              </div>
              <div>
                <label htmlFor="endTime" className="label-strong block mb-1">Término</label>
                <input id="endTime" name="endTime" type="time" required className="input" />
              </div>
            </div>
            <div>
              <label htmlFor="modality" className="label-strong block mb-1">Modalidade</label>
              <select id="modality" name="modality" defaultValue="online" className="input">
                <option value="online">Online</option>
                <option value="presencial">Presencial</option>
              </select>
            </div>
            <div>
              <label htmlFor="location" className="label-strong block mb-1">Local ou link</label>
              <input id="location" name="location" required defaultValue="Link de videochamada" className="input" />
            </div>
            <div>
              <label htmlFor="amount" className="label-strong block mb-1">Valor (R$)</label>
              <input id="amount" name="amount" type="number" step="0.01" min="0" defaultValue={(defaultPriceCents / 100).toFixed(2)} className="input" />
            </div>

            {error ? (
              <div role="alert" className="rounded-md border border-[#f3bcbc] bg-[var(--danger-soft)] p-3 text-[13px] text-[var(--danger-text)]">{error}</div>
            ) : null}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="btn btn-ghost">Cancelar</button>
              <button type="submit" disabled={pending} className="btn btn-primary">
                {pending ? "Salvando..." : "Agendar"}
              </button>
            </div>
          </form>
        </aside>
      </>
    );
  }
  ```
- [ ] **Step 5:** Run `npm run build`. Hit `/agenda` in dev — period filter works, drawer creates session, list refreshes, inline actions update status.
- [ ] **Step 6:** Commit `feat(agenda): list, period filter, inline confirm/attendance, new session drawer`.

---

## Phase 7 — Tela "Atender"

### Task 7.1: `saveAttendance` transactional action

**Files:** Create `src/server/actions/session/saveAttendance.ts`, `tests/integration/session/saveAttendance.test.ts`.

- [ ] **Step 1:** Test:
  ```ts
  import { beforeEach, describe, expect, test } from "vitest";
  import { resetDb, testPrisma } from "../../helpers/db";
  import { hashPassword } from "@/lib/password";

  describe("saveAttendance", () => {
    let userId: string;
    let sessionId: string;

    beforeEach(async () => {
      await resetDb();
      const u = await testPrisma.user.create({
        data: { email: "u@t", passwordHash: await hashPassword("Abcdef12!"), name: "U", crp: "CRP" },
      });
      userId = u.id;
      const p = await testPrisma.patient.create({ data: { userId, name: "Ana", modality: "online" } });
      const s = await testPrisma.therapySession.create({
        data: {
          userId, patientId: p.id, modality: "online", location: "Link", amountCents: 20000,
          startsAt: new Date("2026-05-20T10:00:00-03:00"),
          endsAt: new Date("2026-05-20T10:50:00-03:00"),
        },
      });
      await testPrisma.billingEntry.create({
        data: { userId, patientId: p.id, sessionId: s.id, amountCents: 20000, serviceType: "Psicoterapia", serviceDate: s.startsAt },
      });
      sessionId = s.id;
    });

    test("saves attendance + creates record + creates note + marks billing paid in one tx", async () => {
      const { saveAttendanceForUser } = await import("@/server/actions/session/saveAttendance");
      const r = await saveAttendanceForUser(userId, {
        sessionId,
        attendanceStatus: "present",
        markPaid: true,
        record: {
          template: "DAP",
          fields: [
            { label: "Dado", value: "..." },
            { label: "Avaliação", value: "..." },
            { label: "Plano", value: "..." },
          ],
        },
        note: "Tudo bem na sessão.",
      });
      expect(r.ok).toBe(true);
      const session = await testPrisma.therapySession.findUnique({ where: { id: sessionId } });
      expect(session!.attendanceStatus).toBe("present");
      expect(session!.status).toBe("CONCLUIDA");
      const record = await testPrisma.clinicalRecord.findUnique({ where: { sessionId } });
      expect(record).not.toBeNull();
      const note = await testPrisma.note.findFirst({ where: { sessionId } });
      expect(note!.body).toContain("Tudo bem");
      const billing = await testPrisma.billingEntry.findFirst({ where: { sessionId } });
      expect(billing!.paymentStatus).toBe("PAGO");
    });
  });
  ```
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Create `src/server/actions/session/saveAttendance.ts`:
  ```ts
  "use server";

  import { z } from "zod";
  import { prisma } from "@/lib/db";
  import { requireUser } from "@/lib/auth-helpers";
  import { actionError, actionOk, fromZodError, type ActionResult } from "@/lib/action-result";
  import { revalidatePath } from "next/cache";
  import type { TherapySession, SessionStatus } from "@prisma/client";
  import { createRecordSchema } from "@/lib/validators/record";

  const schema = z.object({
    sessionId: z.string().min(1),
    attendanceStatus: z.enum(["present", "missed", "excused"]),
    markPaid: z.boolean().optional(),
    note: z.string().max(5000).optional(),
    record: createRecordSchema.omit({ patientId: true, sessionId: true }).optional(),
  });
  export type SaveAttendanceInput = z.infer<typeof schema>;

  const statusFor: Record<"present" | "missed" | "excused", SessionStatus> = {
    present: "CONCLUIDA",
    missed: "NAO_COMPARECEU",
    excused: "CANCELADA",
  };

  export async function saveAttendanceForUser(userId: string, input: unknown): Promise<ActionResult<TherapySession>> {
    const parsed = schema.safeParse(input);
    if (!parsed.success) return fromZodError(parsed.error);
    const data = parsed.data;
    const owns = await prisma.therapySession.findFirst({ where: { id: data.sessionId, userId } });
    if (!owns) return actionError("Sessão não encontrada.");

    const updated = await prisma.$transaction(async (tx) => {
      const session = await tx.therapySession.update({
        where: { id: data.sessionId },
        data: {
          attendanceStatus: data.attendanceStatus,
          status: statusFor[data.attendanceStatus],
          documentationStatus: data.record ? "complete" : owns.documentationStatus,
        },
      });

      if (data.record) {
        const retention = new Date();
        retention.setFullYear(retention.getFullYear() + 5);
        await tx.clinicalRecord.upsert({
          where: { sessionId: data.sessionId },
          update: { fields: data.record.fields, contextSummary: data.record.contextSummary },
          create: {
            userId,
            patientId: owns.patientId,
            sessionId: data.sessionId,
            template: data.record.template,
            fields: data.record.fields,
            contextSummary: data.record.contextSummary,
            retentionUntil: retention,
          },
        });
      }

      if (data.note) {
        await tx.note.create({
          data: { userId, patientId: owns.patientId, sessionId: data.sessionId, body: data.note },
        });
      }

      if (data.markPaid) {
        await tx.billingEntry.updateMany({
          where: { sessionId: data.sessionId },
          data: { paymentStatus: "PAGO", paidAt: new Date() },
        });
        await tx.therapySession.update({
          where: { id: data.sessionId },
          data: { paymentStatus: "PAGO" },
        });
      }

      return session;
    });

    return actionOk(updated);
  }

  export async function saveAttendance(input: SaveAttendanceInput): Promise<ActionResult<TherapySession>> {
    const user = await requireUser();
    const r = await saveAttendanceForUser(user.id, input);
    if (r.ok) {
      revalidatePath("/agenda");
      revalidatePath("/");
      revalidatePath(`/agenda/${input.sessionId}`);
    }
    return r;
  }
  ```
- [ ] **Step 4:** Run test. Expected: PASS.
- [ ] **Step 5:** Commit `feat(session): saveAttendance transactional (record + note + billing)`.

---

### Task 7.2: `/agenda/[id]` Atender page

**Files:** Create `src/app/(app)/agenda/[id]/page.tsx`, `src/app/(app)/agenda/[id]/AttendForm.tsx`.

- [ ] **Step 1:** Create `src/app/(app)/agenda/[id]/page.tsx`:
  ```tsx
  import Link from "next/link";
  import { notFound } from "next/navigation";
  import { ArrowLeft } from "lucide-react";
  import { requireUser } from "@/lib/auth-helpers";
  import { getSession } from "@/server/queries/session";
  import { AttendForm } from "./AttendForm";

  export const dynamic = "force-dynamic";

  export default async function AttendPage({ params }: { params: Promise<{ id: string }> }) {
    const user = await requireUser();
    const { id } = await params;
    const session = await getSession(user.id, id);
    if (!session) notFound();

    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-8">
        <Link href="/agenda" className="btn btn-ghost btn-sm -ml-2 mb-4 inline-flex">
          <ArrowLeft size={14} strokeWidth={1.8} /> Voltar para agenda
        </Link>
        <header className="mb-5">
          <p className="label">Atender sessão</p>
          <h1 className="h-page mt-1">{session.patient.name}</h1>
          <p className="mt-1 text-[13px] text-[var(--ink-4)]">
            {new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" }).format(session.startsAt)}
            {" · "}{session.modality === "online" ? "Online" : "Presencial"}
          </p>
        </header>
        <AttendForm session={session} />
      </div>
    );
  }
  ```
- [ ] **Step 2:** Create `src/app/(app)/agenda/[id]/AttendForm.tsx`:
  ```tsx
  "use client";

  import { useState, useTransition } from "react";
  import { useRouter } from "next/navigation";
  import type { Patient, TherapySession, RecordTemplate } from "@prisma/client";
  import { saveAttendance } from "@/server/actions/session/saveAttendance";

  type DapField = { label: "Dado" | "Avaliação" | "Plano"; value: string };
  type BirpField = { label: "Behavior" | "Intervention" | "Response" | "Plan"; value: string };

  const DAP_LABELS: DapField["label"][] = ["Dado", "Avaliação", "Plano"];
  const BIRP_LABELS: BirpField["label"][] = ["Behavior", "Intervention", "Response", "Plan"];

  export function AttendForm({ session }: { session: TherapySession & { patient: Patient } }) {
    const router = useRouter();
    const [attendance, setAttendance] = useState<"present" | "missed" | "excused">("present");
    const [template, setTemplate] = useState<RecordTemplate>("DAP");
    const [fields, setFields] = useState<{ label: string; value: string }[]>(
      DAP_LABELS.map((l) => ({ label: l, value: "" })),
    );
    const [note, setNote] = useState("");
    const [markPaid, setMarkPaid] = useState(session.paymentStatus !== "PAGO");
    const [error, setError] = useState<string | null>(null);
    const [pending, start] = useTransition();

    function setTemplateAndReset(t: RecordTemplate) {
      setTemplate(t);
      const labels = t === "DAP" ? DAP_LABELS : BIRP_LABELS;
      setFields(labels.map((l) => ({ label: l, value: "" })));
    }

    function setField(i: number, value: string) {
      setFields((prev) => prev.map((f, idx) => (idx === i ? { ...f, value } : f)));
    }

    function onSubmit(e: React.FormEvent) {
      e.preventDefault();
      setError(null);
      const hasRecord = fields.some((f) => f.value.trim().length > 0);
      start(async () => {
        const r = await saveAttendance({
          sessionId: session.id,
          attendanceStatus: attendance,
          markPaid,
          note: note.trim() || undefined,
          record: hasRecord ? { template, fields } : undefined,
        });
        if (r.ok) {
          router.replace("/agenda");
          router.refresh();
        } else {
          setError(r.error);
        }
      });
    }

    return (
      <form onSubmit={onSubmit} className="space-y-6">
        <section className="card p-5">
          <p className="label-strong mb-2">Presença</p>
          <div className="flex gap-2">
            {(["present", "missed", "excused"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAttendance(v)}
                className={attendance === v ? "btn btn-primary" : "btn btn-secondary"}
              >
                {v === "present" ? "Presente" : v === "missed" ? "Falta" : "Justificada"}
              </button>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="label-strong">Prontuário</p>
            <div className="flex gap-2">
              {(["DAP", "BIRP"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTemplateAndReset(t)}
                  className={template === t ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {fields.map((f, i) => (
              <div key={f.label}>
                <label htmlFor={`f-${i}`} className="label-strong block mb-1">{f.label}</label>
                <textarea id={`f-${i}`} value={f.value} onChange={(e) => setField(i, e.target.value)} rows={3} className="input min-h-[88px] py-2 leading-snug" />
              </div>
            ))}
          </div>
          <p className="mt-2 text-[12px] text-[var(--ink-5)]">Deixe em branco para não criar prontuário desta sessão.</p>
        </section>

        <section className="card p-5">
          <label htmlFor="note" className="label-strong block mb-2">Anotação rápida</label>
          <textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="input min-h-[88px] py-2 leading-snug" placeholder="Algo curto pra lembrar depois (opcional)..." />
        </section>

        <section className="card p-5">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={markPaid} onChange={(e) => setMarkPaid(e.target.checked)} />
            <span className="text-[14px]">Marcar cobrança como paga</span>
          </label>
        </section>

        {error ? (
          <div role="alert" className="rounded-md border border-[#f3bcbc] bg-[var(--danger-soft)] p-3 text-[13px] text-[var(--danger-text)]">{error}</div>
        ) : null}

        <div className="flex justify-end">
          <button type="submit" disabled={pending} className="btn btn-primary">
            {pending ? "Salvando..." : "Salvar atendimento"}
          </button>
        </div>
      </form>
    );
  }
  ```
- [ ] **Step 3:** Run `npm run build`. In dev: from `/agenda`, click a patient name → land on `/agenda/<id>` → fill record + mark paid → submit → returns to `/agenda` with status updated.
- [ ] **Step 4:** Commit `feat(agenda): tela Atender single-screen (presença + prontuário + nota + pagamento)`.

---

## Phase 8 — Records + Notes

### Task 8.1: `createRecord`, `updateRecord`, `deleteRecord` actions (with retention rule)

**Files:** Create `src/server/actions/record/{createRecord,updateRecord,deleteRecord}.ts`, `tests/integration/record/record-crud.test.ts`.

- [ ] **Step 1:** Tests:
  ```ts
  import { beforeEach, describe, expect, test } from "vitest";
  import { resetDb, testPrisma } from "../../helpers/db";
  import { hashPassword } from "@/lib/password";

  describe("record CRUD", () => {
    let userId: string;
    let patientId: string;

    beforeEach(async () => {
      await resetDb();
      const u = await testPrisma.user.create({
        data: { email: "u@t", passwordHash: await hashPassword("Abcdef12!"), name: "U", crp: "CRP" },
      });
      userId = u.id;
      const p = await testPrisma.patient.create({ data: { userId, name: "Ana", modality: "online" } });
      patientId = p.id;
    });

    test("createRecord sets retentionUntil to +5 years", async () => {
      const { createRecordForUser } = await import("@/server/actions/record/createRecord");
      const r = await createRecordForUser(userId, {
        patientId,
        template: "DAP",
        fields: [
          { label: "Dado", value: "x" },
          { label: "Avaliação", value: "y" },
          { label: "Plano", value: "z" },
        ],
      });
      expect(r.ok).toBe(true);
      if (r.ok) {
        const diffYears = (r.data.retentionUntil.getTime() - Date.now()) / (365.25 * 24 * 60 * 60 * 1000);
        expect(diffYears).toBeGreaterThan(4.99);
        expect(diffYears).toBeLessThan(5.01);
      }
    });

    test("updateRecord changes fields", async () => {
      const { createRecordForUser } = await import("@/server/actions/record/createRecord");
      const { updateRecordForUser } = await import("@/server/actions/record/updateRecord");
      const created = await createRecordForUser(userId, {
        patientId, template: "DAP",
        fields: [{ label: "Dado", value: "a" }, { label: "Avaliação", value: "b" }, { label: "Plano", value: "c" }],
      });
      if (!created.ok) throw new Error("setup failed");
      const r = await updateRecordForUser(userId, {
        id: created.data.id,
        fields: [{ label: "Dado", value: "X" }, { label: "Avaliação", value: "Y" }, { label: "Plano", value: "Z" }],
      });
      expect(r.ok).toBe(true);
      if (r.ok) {
        const arr = r.data.fields as Array<{ value: string }>;
        expect(arr[0].value).toBe("X");
      }
    });

    test("deleteRecord fails while retention is active", async () => {
      const { createRecordForUser } = await import("@/server/actions/record/createRecord");
      const { deleteRecordForUser } = await import("@/server/actions/record/deleteRecord");
      const c = await createRecordForUser(userId, {
        patientId, template: "DAP",
        fields: [{ label: "Dado", value: "a" }, { label: "Avaliação", value: "b" }, { label: "Plano", value: "c" }],
      });
      if (!c.ok) throw new Error("setup failed");
      const r = await deleteRecordForUser(userId, { id: c.data.id });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toMatch(/reten/i);
    });

    test("deleteRecord succeeds once retention expires", async () => {
      const { deleteRecordForUser } = await import("@/server/actions/record/deleteRecord");
      const old = await testPrisma.clinicalRecord.create({
        data: {
          userId, patientId, template: "DAP",
          fields: [{ label: "Dado", value: "a" }, { label: "Avaliação", value: "b" }, { label: "Plano", value: "c" }],
          retentionUntil: new Date(Date.now() - 1000),
        },
      });
      const r = await deleteRecordForUser(userId, { id: old.id });
      expect(r.ok).toBe(true);
    });
  });
  ```
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Create `src/server/actions/record/createRecord.ts`:
  ```ts
  "use server";

  import { prisma } from "@/lib/db";
  import { requireUser } from "@/lib/auth-helpers";
  import { createRecordSchema, type CreateRecordInput } from "@/lib/validators/record";
  import { actionError, actionOk, fromZodError, type ActionResult } from "@/lib/action-result";
  import { revalidatePath } from "next/cache";
  import type { ClinicalRecord } from "@prisma/client";

  export async function createRecordForUser(
    userId: string,
    input: CreateRecordInput,
  ): Promise<ActionResult<ClinicalRecord>> {
    const parsed = createRecordSchema.safeParse(input);
    if (!parsed.success) return fromZodError(parsed.error);
    const data = parsed.data;
    const owns = await prisma.patient.findFirst({ where: { id: data.patientId, userId } });
    if (!owns) return actionError("Paciente não encontrado.");

    const retention = new Date();
    retention.setFullYear(retention.getFullYear() + 5);

    const record = await prisma.clinicalRecord.create({
      data: {
        userId,
        patientId: data.patientId,
        sessionId: data.sessionId,
        template: data.template,
        fields: data.fields,
        contextSummary: data.contextSummary,
        retentionUntil: retention,
      },
    });
    return actionOk(record);
  }

  export async function createRecord(input: CreateRecordInput): Promise<ActionResult<ClinicalRecord>> {
    const user = await requireUser();
    const r = await createRecordForUser(user.id, input);
    if (r.ok) {
      revalidatePath("/prontuarios");
      revalidatePath(`/pacientes/${input.patientId}`);
    }
    return r;
  }
  ```
- [ ] **Step 4:** Create `src/server/actions/record/updateRecord.ts`:
  ```ts
  "use server";

  import { prisma } from "@/lib/db";
  import { requireUser } from "@/lib/auth-helpers";
  import { updateRecordSchema } from "@/lib/validators/record";
  import { actionError, actionOk, fromZodError, type ActionResult } from "@/lib/action-result";
  import { revalidatePath } from "next/cache";
  import type { ClinicalRecord } from "@prisma/client";

  export async function updateRecordForUser(userId: string, input: unknown): Promise<ActionResult<ClinicalRecord>> {
    const parsed = updateRecordSchema.safeParse(input);
    if (!parsed.success) return fromZodError(parsed.error);
    const owns = await prisma.clinicalRecord.findFirst({ where: { id: parsed.data.id, userId } });
    if (!owns) return actionError("Prontuário não encontrado.");
    const updated = await prisma.clinicalRecord.update({
      where: { id: parsed.data.id },
      data: { fields: parsed.data.fields, contextSummary: parsed.data.contextSummary },
    });
    return actionOk(updated);
  }

  export async function updateRecord(input: unknown): Promise<ActionResult<ClinicalRecord>> {
    const user = await requireUser();
    const r = await updateRecordForUser(user.id, input);
    if (r.ok) {
      revalidatePath("/prontuarios");
      revalidatePath(`/prontuarios/${r.data.id}`);
    }
    return r;
  }
  ```
- [ ] **Step 5:** Create `src/server/actions/record/deleteRecord.ts`:
  ```ts
  "use server";

  import { z } from "zod";
  import { prisma } from "@/lib/db";
  import { requireUser } from "@/lib/auth-helpers";
  import { actionError, actionOk, fromZodError, type ActionResult } from "@/lib/action-result";
  import { revalidatePath } from "next/cache";

  const schema = z.object({ id: z.string().min(1) });

  export async function deleteRecordForUser(userId: string, input: unknown): Promise<ActionResult<{ id: string }>> {
    const parsed = schema.safeParse(input);
    if (!parsed.success) return fromZodError(parsed.error);
    const record = await prisma.clinicalRecord.findFirst({ where: { id: parsed.data.id, userId } });
    if (!record) return actionError("Prontuário não encontrado.");
    if (record.retentionUntil > new Date()) {
      return actionError(
        `Não é possível excluir antes do fim da retenção (${record.retentionUntil.toISOString().slice(0, 10)}).`,
      );
    }
    await prisma.clinicalRecord.delete({ where: { id: record.id } });
    return actionOk({ id: record.id });
  }

  export async function deleteRecord(input: unknown): Promise<ActionResult<{ id: string }>> {
    const user = await requireUser();
    const r = await deleteRecordForUser(user.id, input);
    if (r.ok) revalidatePath("/prontuarios");
    return r;
  }
  ```
- [ ] **Step 6:** Run tests. Expected: 4 PASS.
- [ ] **Step 7:** Commit `feat(record): create/update/delete with retention rule + tests`.

---

### Task 8.2: Record queries

**Files:** Create `src/server/queries/record.ts`.

- [ ] **Step 1:** Create `src/server/queries/record.ts`:
  ```ts
  import { prisma } from "@/lib/db";
  import type { ClinicalRecord, Patient } from "@prisma/client";

  export type RecordWithPatient = ClinicalRecord & { patient: Patient };

  export async function listRecords(
    userId: string,
    opts: { search?: string } = {},
  ): Promise<RecordWithPatient[]> {
    return prisma.clinicalRecord.findMany({
      where: {
        userId,
        ...(opts.search
          ? {
              OR: [
                { patient: { name: { contains: opts.search, mode: "insensitive" } } },
                { template: opts.search.toUpperCase() === "DAP" ? "DAP" : opts.search.toUpperCase() === "BIRP" ? "BIRP" : undefined },
              ],
            }
          : {}),
      },
      include: { patient: true },
      orderBy: { createdAt: "desc" },
    });
  }

  export async function getRecord(userId: string, id: string): Promise<RecordWithPatient | null> {
    return prisma.clinicalRecord.findFirst({ where: { id, userId }, include: { patient: true } });
  }

  export async function listRecordsForPatient(userId: string, patientId: string): Promise<ClinicalRecord[]> {
    return prisma.clinicalRecord.findMany({
      where: { userId, patientId },
      orderBy: { createdAt: "desc" },
    });
  }

  export async function countPendingRecords(userId: string): Promise<number> {
    return prisma.therapySession.count({
      where: {
        userId,
        status: "CONCLUIDA",
        documentationStatus: { not: "complete" },
      },
    });
  }
  ```
- [ ] **Step 2:** Type-check: `npx tsc --noEmit`. Expected: no errors.
- [ ] **Step 3:** Commit `feat(record): queries (list, get, listForPatient, countPending)`.

---

### Task 8.3: Migrate `/prontuarios` listing to DB

**Files:** Replace `src/app/(app)/prontuarios/page.tsx`. Create `src/app/(app)/prontuarios/_components/RecordList.tsx`.

- [ ] **Step 1:** Replace `src/app/(app)/prontuarios/page.tsx`:
  ```tsx
  import { FileText } from "lucide-react";
  import { requireUser } from "@/lib/auth-helpers";
  import { listRecords } from "@/server/queries/record";
  import { RecordList } from "./_components/RecordList";

  export const dynamic = "force-dynamic";

  export default async function ProntuariosPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
    const user = await requireUser();
    const { q = "" } = await searchParams;
    const records = await listRecords(user.id, { search: q });
    return (
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
        <div className="mb-6">
          <p className="label">Clínico</p>
          <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-[var(--ink)]">Prontuários DAP e BIRP</h2>
          <p className="mt-1 text-[13px] text-[var(--ink-4)]">{records.length} {records.length === 1 ? "registro" : "registros"}</p>
        </div>
        <RecordList records={records} initialSearch={q} />
      </div>
    );
  }
  ```
- [ ] **Step 2:** Create `src/app/(app)/prontuarios/_components/RecordList.tsx`:
  ```tsx
  "use client";

  import { useState } from "react";
  import { useRouter } from "next/navigation";
  import Link from "next/link";
  import type { ClinicalRecord, Patient } from "@prisma/client";
  import { SearchInput } from "@/components/ui/search-input";
  import { EmptyState } from "@/components/ui/empty-state";
  import { Badge } from "@/components/ui/badge";
  import { formatDate } from "@/lib/format/date";
  import { FileText } from "lucide-react";

  type RWP = ClinicalRecord & { patient: Patient };

  export function RecordList({ records, initialSearch }: { records: RWP[]; initialSearch: string }) {
    const router = useRouter();
    const [search, setSearch] = useState(initialSearch);

    function onSearch(v: string) {
      setSearch(v);
      const url = new URL(window.location.href);
      if (v) url.searchParams.set("q", v); else url.searchParams.delete("q");
      router.replace(url.pathname + url.search);
    }

    return (
      <>
        <div className="mb-4 max-w-md">
          <SearchInput placeholder="Buscar por paciente ou template..." value={search} onChange={onSearch} />
        </div>
        {records.length === 0 ? (
          <EmptyState icon={FileText} title="Sem prontuários" description="Você verá aqui os prontuários DAP e BIRP." />
        ) : (
          <div className="space-y-3">
            {records.map((r) => (
              <article key={r.id} className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/prontuarios/${r.id}`} className="text-[15px] font-semibold text-[var(--ink)] hover:text-[var(--blue)]">
                      {r.patient.name}
                    </Link>
                    <p className="mt-1 text-[12.5px] text-[var(--ink-4)]">
                      Criado em {formatDate(r.createdAt)} · Retenção até {formatDate(r.retentionUntil)}
                    </p>
                  </div>
                  <Badge variant="info">{r.template}</Badge>
                </div>
              </article>
            ))}
          </div>
        )}
      </>
    );
  }
  ```
- [ ] **Step 3:** Run `npm run build`. Hit `/prontuarios` in dev. Should list real records (if any created via Atender).
- [ ] **Step 4:** Commit `feat(record): /prontuarios listing from DB with search`.

---

### Task 8.4: Migrate `/prontuarios/[id]` editor

**Files:** Replace `src/app/(app)/prontuarios/[id]/page.tsx`. Create `src/app/(app)/prontuarios/[id]/RecordEditor.tsx`.

- [ ] **Step 1:** Create `src/app/(app)/prontuarios/[id]/RecordEditor.tsx`:
  ```tsx
  "use client";

  import { useState, useTransition } from "react";
  import { useRouter } from "next/navigation";
  import type { ClinicalRecord } from "@prisma/client";
  import { updateRecord } from "@/server/actions/record/updateRecord";

  type Field = { label: string; value: string };

  export function RecordEditor({ record }: { record: ClinicalRecord }) {
    const router = useRouter();
    const [fields, setFields] = useState<Field[]>(record.fields as Field[]);
    const [contextSummary, setContextSummary] = useState(record.contextSummary ?? "");
    const [pending, start] = useTransition();
    const [savedAt, setSavedAt] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);

    function setField(i: number, value: string) {
      setFields((prev) => prev.map((f, idx) => (idx === i ? { ...f, value } : f)));
    }

    function onSubmit(e: React.FormEvent) {
      e.preventDefault();
      setError(null);
      start(async () => {
        const r = await updateRecord({ id: record.id, fields, contextSummary: contextSummary || undefined });
        if (r.ok) {
          setSavedAt(new Date());
          router.refresh();
        } else {
          setError(r.error);
        }
      });
    }

    return (
      <form onSubmit={onSubmit} className="space-y-4">
        {fields.map((f, i) => (
          <div key={f.label}>
            <label htmlFor={`f-${i}`} className="label-strong block mb-1">{f.label}</label>
            <textarea id={`f-${i}`} value={f.value} onChange={(e) => setField(i, e.target.value)} rows={4} className="input min-h-[112px] py-2 leading-snug" />
          </div>
        ))}
        <div>
          <label htmlFor="ctx" className="label-strong block mb-1">Contexto e continuidade</label>
          <textarea id="ctx" value={contextSummary} onChange={(e) => setContextSummary(e.target.value)} rows={3} className="input min-h-[88px] py-2 leading-snug" placeholder="Opcional" />
        </div>
        {error ? (
          <div role="alert" className="rounded-md border border-[#f3bcbc] bg-[var(--danger-soft)] p-3 text-[13px] text-[var(--danger-text)]">{error}</div>
        ) : null}
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-[var(--ink-5)]">
            {savedAt ? `Salvo às ${savedAt.toLocaleTimeString("pt-BR")}` : ""}
          </span>
          <button type="submit" disabled={pending} className="btn btn-primary">
            {pending ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </form>
    );
  }
  ```
- [ ] **Step 2:** Replace `src/app/(app)/prontuarios/[id]/page.tsx`:
  ```tsx
  import Link from "next/link";
  import { notFound } from "next/navigation";
  import { ArrowLeft, Printer } from "lucide-react";
  import { requireUser } from "@/lib/auth-helpers";
  import { getRecord } from "@/server/queries/record";
  import { Badge } from "@/components/ui/badge";
  import { formatDate } from "@/lib/format/date";
  import { RecordEditor } from "./RecordEditor";

  export const dynamic = "force-dynamic";

  export default async function ProntuarioPage({ params }: { params: Promise<{ id: string }> }) {
    const user = await requireUser();
    const { id } = await params;
    const record = await getRecord(user.id, id);
    if (!record) notFound();

    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link href="/prontuarios" className="btn btn-ghost btn-sm -ml-2 inline-flex">
            <ArrowLeft size={14} strokeWidth={1.8} /> Voltar
          </Link>
          <Link href={`/api/records/export/${record.id}`} target="_blank" className="btn btn-secondary btn-sm">
            <Printer size={14} strokeWidth={1.8} /> Exportar
          </Link>
        </div>
        <header className="card p-6 mb-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="h-page">{record.patient.name}</h1>
              <p className="mt-1 text-[13px] text-[var(--ink-4)]">
                Criado em {formatDate(record.createdAt)} · Retenção até {formatDate(record.retentionUntil)}
              </p>
            </div>
            <Badge variant="info">{record.template}</Badge>
          </div>
        </header>
        <section className="card p-6">
          <RecordEditor record={record} />
        </section>
      </div>
    );
  }
  ```
- [ ] **Step 3:** Run `npm run build`. Open a record in dev, edit a field, save — verify changes persist.
- [ ] **Step 4:** Commit `feat(record): /prontuarios/[id] editor with autosave button`.

---

### Task 8.5: Notes — `createNote` and `deleteNote` actions

**Files:** Create `src/server/actions/note/{createNote,deleteNote}.ts`, `tests/integration/note/note.test.ts`.

- [ ] **Step 1:** Test:
  ```ts
  import { beforeEach, describe, expect, test } from "vitest";
  import { resetDb, testPrisma } from "../../helpers/db";
  import { hashPassword } from "@/lib/password";

  describe("note CRUD", () => {
    let userId: string;
    let patientId: string;

    beforeEach(async () => {
      await resetDb();
      const u = await testPrisma.user.create({
        data: { email: "u@t", passwordHash: await hashPassword("Abcdef12!"), name: "U", crp: "CRP" },
      });
      userId = u.id;
      const p = await testPrisma.patient.create({ data: { userId, name: "Ana", modality: "online" } });
      patientId = p.id;
    });

    test("creates note tied to patient", async () => {
      const { createNoteForUser } = await import("@/server/actions/note/createNote");
      const r = await createNoteForUser(userId, { patientId, body: "Boa sessão hoje." });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.body).toBe("Boa sessão hoje.");
    });

    test("rejects empty body", async () => {
      const { createNoteForUser } = await import("@/server/actions/note/createNote");
      const r = await createNoteForUser(userId, { patientId, body: "" });
      expect(r.ok).toBe(false);
    });

    test("deleteNote removes own note", async () => {
      const { createNoteForUser } = await import("@/server/actions/note/createNote");
      const { deleteNoteForUser } = await import("@/server/actions/note/deleteNote");
      const c = await createNoteForUser(userId, { patientId, body: "x" });
      if (!c.ok) throw new Error("setup failed");
      const r = await deleteNoteForUser(userId, { id: c.data.id });
      expect(r.ok).toBe(true);
      expect(await testPrisma.note.count()).toBe(0);
    });
  });
  ```
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Create `src/server/actions/note/createNote.ts`:
  ```ts
  "use server";

  import { prisma } from "@/lib/db";
  import { requireUser } from "@/lib/auth-helpers";
  import { createNoteSchema, type CreateNoteInput } from "@/lib/validators/note";
  import { actionError, actionOk, fromZodError, type ActionResult } from "@/lib/action-result";
  import { revalidatePath } from "next/cache";
  import type { Note } from "@prisma/client";

  export async function createNoteForUser(userId: string, input: CreateNoteInput): Promise<ActionResult<Note>> {
    const parsed = createNoteSchema.safeParse(input);
    if (!parsed.success) return fromZodError(parsed.error);
    const owns = await prisma.patient.findFirst({ where: { id: parsed.data.patientId, userId } });
    if (!owns) return actionError("Paciente não encontrado.");
    const note = await prisma.note.create({
      data: {
        userId,
        patientId: parsed.data.patientId,
        sessionId: parsed.data.sessionId,
        body: parsed.data.body,
      },
    });
    return actionOk(note);
  }

  export async function createNote(input: CreateNoteInput): Promise<ActionResult<Note>> {
    const user = await requireUser();
    const r = await createNoteForUser(user.id, input);
    if (r.ok) revalidatePath(`/pacientes/${input.patientId}`);
    return r;
  }
  ```
- [ ] **Step 4:** Create `src/server/actions/note/deleteNote.ts`:
  ```ts
  "use server";

  import { z } from "zod";
  import { prisma } from "@/lib/db";
  import { requireUser } from "@/lib/auth-helpers";
  import { actionError, actionOk, fromZodError, type ActionResult } from "@/lib/action-result";
  import { revalidatePath } from "next/cache";

  const schema = z.object({ id: z.string().min(1) });

  export async function deleteNoteForUser(userId: string, input: unknown): Promise<ActionResult<{ id: string }>> {
    const parsed = schema.safeParse(input);
    if (!parsed.success) return fromZodError(parsed.error);
    const note = await prisma.note.findFirst({ where: { id: parsed.data.id, userId } });
    if (!note) return actionError("Anotação não encontrada.");
    await prisma.note.delete({ where: { id: note.id } });
    return actionOk({ id: note.id });
  }

  export async function deleteNote(input: unknown): Promise<ActionResult<{ id: string }>> {
    const user = await requireUser();
    const r = await deleteNoteForUser(user.id, input);
    if (r.ok) revalidatePath("/pacientes");
    return r;
  }
  ```
- [ ] **Step 5:** Run tests. Expected: 3 PASS.
- [ ] **Step 6:** Commit `feat(note): create/delete actions with ownership check + tests`.

---

### Task 8.6: Patient detail page sections (Sessões + Prontuários + Anotações + Financeiro)

Spec: a ficha do paciente deve mostrar Sessões, Prontuários, Anotações e Financeiro. Implementação como **seções** (mais simples e SEO-friendly que tabs com URL state); cada seção é um Server Component com suas próprias queries. A "+ Nova anotação" usa um form inline.

**Files:** Replace `src/app/(app)/pacientes/[id]/page.tsx`. Create `_components/{SessionsSection,RecordsSection,NotesSection,BillingSection,NewNoteForm,DeleteNoteButton}.tsx`.

- [ ] **Step 1:** Replace `src/app/(app)/pacientes/[id]/page.tsx`:
  ```tsx
  import Link from "next/link";
  import { notFound } from "next/navigation";
  import { ArrowLeft, MessageCircle } from "lucide-react";
  import { requireUser } from "@/lib/auth-helpers";
  import { getPatient } from "@/server/queries/patient";
  import { listSessionsForPatient } from "@/server/queries/session";
  import { listRecordsForPatient } from "@/server/queries/record";
  import { billingForPatient } from "@/server/queries/billing";
  import { prisma } from "@/lib/db";
  import { Badge } from "@/components/ui/badge";
  import { Panel } from "@/components/ui/panel";
  import { whatsappToWaMeLink } from "@/lib/format/phone";
  import { SessionsSection } from "./_components/SessionsSection";
  import { RecordsSection } from "./_components/RecordsSection";
  import { NotesSection } from "./_components/NotesSection";
  import { BillingSection } from "./_components/BillingSection";

  export const dynamic = "force-dynamic";

  export default async function PacienteDetalhePage({ params }: { params: Promise<{ id: string }> }) {
    const user = await requireUser();
    const { id } = await params;
    const patient = await getPatient(user.id, id);
    if (!patient) notFound();

    const [sessions, records, notes, billing] = await Promise.all([
      listSessionsForPatient(user.id, id),
      listRecordsForPatient(user.id, id),
      prisma.note.findMany({ where: { userId: user.id, patientId: id }, orderBy: { createdAt: "desc" } }),
      billingForPatient(user.id, id),
    ]);

    const initials = patient.name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("");

    return (
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
        <Link href="/pacientes" className="btn btn-ghost btn-sm -ml-2 mb-4 inline-flex">
          <ArrowLeft size={14} strokeWidth={1.8} /> Voltar
        </Link>

        <header className="card mb-5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="flex size-14 items-center justify-center rounded-full bg-[var(--blue-soft)] text-[17px] font-semibold text-[var(--blue-text)]">
                {initials}
              </div>
              <div>
                <h1 className="h-page text-[22px]">{patient.name}</h1>
                <p className="mt-1 text-[13px] text-[var(--ink-4)]">
                  {patient.whatsapp ?? "Sem WhatsApp"}{patient.email ? ` · ${patient.email}` : ""}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge variant={patient.modality === "online" ? "info" : "neutral"}>
                    {patient.modality === "online" ? "Online" : "Presencial"}
                  </Badge>
                  <Badge variant={patient.consentStatus === "complete" ? "success" : patient.consentStatus === "expired" ? "danger" : "warning"}>
                    Consentimento {patient.consentStatus}
                  </Badge>
                </div>
              </div>
            </div>
            {patient.whatsapp ? (
              <a
                href={whatsappToWaMeLink(patient.whatsapp)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
              >
                <MessageCircle size={15} strokeWidth={1.8} /> Abrir WhatsApp
              </a>
            ) : null}
          </div>
        </header>

        <nav className="mb-5 flex flex-wrap gap-2 text-[13px]" aria-label="Atalhos">
          <a href="#sessoes" className="btn btn-ghost btn-sm">Sessões ({sessions.length})</a>
          <a href="#prontuarios" className="btn btn-ghost btn-sm">Prontuários ({records.length})</a>
          <a href="#anotacoes" className="btn btn-ghost btn-sm">Anotações ({notes.length})</a>
          <a href="#financeiro" className="btn btn-ghost btn-sm">Financeiro ({billing.length})</a>
        </nav>

        <div className="space-y-5">
          <section id="sessoes" className="scroll-mt-20">
            <SessionsSection sessions={sessions} />
          </section>
          <section id="prontuarios" className="scroll-mt-20">
            <RecordsSection records={records} />
          </section>
          <section id="anotacoes" className="scroll-mt-20">
            <NotesSection notes={notes} patientId={patient.id} />
          </section>
          <section id="financeiro" className="scroll-mt-20">
            <BillingSection billing={billing} />
          </section>
        </div>
      </div>
    );
  }
  ```
- [ ] **Step 2:** Create `src/app/(app)/pacientes/[id]/_components/SessionsSection.tsx`:
  ```tsx
  import Link from "next/link";
  import type { TherapySession } from "@prisma/client";
  import { Panel } from "@/components/ui/panel";
  import { Badge } from "@/components/ui/badge";
  import { formatDateTime } from "@/lib/format/date";
  import { CalendarDays } from "lucide-react";

  export function SessionsSection({ sessions }: { sessions: TherapySession[] }) {
    return (
      <Panel eyebrow="Histórico" title="Sessões" icon={CalendarDays} padded={false}>
        {sessions.length === 0 ? (
          <p className="px-5 py-6 text-[13px] text-[var(--ink-4)]">Nenhuma sessão registrada.</p>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {sessions.map((s) => (
              <article key={s.id} className="row-hover grid grid-cols-[1fr_auto] gap-3 px-5 py-3 items-center">
                <div>
                  <Link href={`/agenda/${s.id}`} className="text-[14px] font-semibold text-[var(--ink)] hover:text-[var(--blue)]">
                    {formatDateTime(s.startsAt)}
                  </Link>
                  <p className="mt-0.5 text-[12.5px] text-[var(--ink-4)]">{s.serviceType} · {s.modality}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant={s.status === "CONCLUIDA" ? "success" : s.status === "CANCELADA" || s.status === "NAO_COMPARECEU" ? "danger" : "neutral"}>
                    {s.status}
                  </Badge>
                  <Badge variant={s.paymentStatus === "PAGO" ? "success" : "warning"}>
                    {s.paymentStatus === "PAGO" ? "Pago" : "Pendente"}
                  </Badge>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>
    );
  }
  ```
- [ ] **Step 3:** Create `src/app/(app)/pacientes/[id]/_components/RecordsSection.tsx`:
  ```tsx
  import Link from "next/link";
  import type { ClinicalRecord } from "@prisma/client";
  import { Panel } from "@/components/ui/panel";
  import { Badge } from "@/components/ui/badge";
  import { formatDate } from "@/lib/format/date";
  import { FileText } from "lucide-react";

  export function RecordsSection({ records }: { records: ClinicalRecord[] }) {
    return (
      <Panel eyebrow="Clínico" title="Prontuários" icon={FileText} padded={false}>
        {records.length === 0 ? (
          <p className="px-5 py-6 text-[13px] text-[var(--ink-4)]">Nenhum prontuário ainda.</p>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {records.map((r) => (
              <article key={r.id} className="row-hover flex items-center justify-between gap-3 px-5 py-3">
                <Link href={`/prontuarios/${r.id}`} className="text-[14px] font-semibold text-[var(--ink)] hover:text-[var(--blue)]">
                  {formatDate(r.createdAt)}
                </Link>
                <Badge variant="info">{r.template}</Badge>
              </article>
            ))}
          </div>
        )}
      </Panel>
    );
  }
  ```
- [ ] **Step 4:** Create `src/app/(app)/pacientes/[id]/_components/NewNoteForm.tsx`:
  ```tsx
  "use client";

  import { useState, useTransition, useRef } from "react";
  import { useRouter } from "next/navigation";
  import { createNote } from "@/server/actions/note/createNote";

  export function NewNoteForm({ patientId }: { patientId: string }) {
    const router = useRouter();
    const [pending, start] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const ref = useRef<HTMLTextAreaElement>(null);

    function onSubmit(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault();
      setError(null);
      const body = ref.current?.value.trim() ?? "";
      if (!body) return;
      start(async () => {
        const r = await createNote({ patientId, body });
        if (r.ok) {
          if (ref.current) ref.current.value = "";
          router.refresh();
        } else {
          setError(r.error);
        }
      });
    }

    return (
      <form onSubmit={onSubmit} className="space-y-2 border-b border-[var(--border)] p-5">
        <label htmlFor="note-body" className="label-strong">Nova anotação</label>
        <textarea id="note-body" ref={ref} rows={2} placeholder="Algo pra lembrar depois..." className="input min-h-[64px] py-2 leading-snug" />
        {error ? <p className="text-[12px] text-[var(--danger)]">{error}</p> : null}
        <div className="flex justify-end">
          <button type="submit" disabled={pending} className="btn btn-primary btn-sm">
            {pending ? "Salvando..." : "Adicionar"}
          </button>
        </div>
      </form>
    );
  }
  ```
- [ ] **Step 5:** Create `src/app/(app)/pacientes/[id]/_components/DeleteNoteButton.tsx`:
  ```tsx
  "use client";

  import { useTransition } from "react";
  import { useRouter } from "next/navigation";
  import { deleteNote } from "@/server/actions/note/deleteNote";

  export function DeleteNoteButton({ id }: { id: string }) {
    const router = useRouter();
    const [pending, start] = useTransition();
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm("Apagar esta anotação?")) return;
          start(async () => { await deleteNote({ id }); router.refresh(); });
        }}
        className="btn btn-ghost btn-sm text-[var(--danger)]"
      >
        Apagar
      </button>
    );
  }
  ```
- [ ] **Step 6:** Create `src/app/(app)/pacientes/[id]/_components/NotesSection.tsx`:
  ```tsx
  import type { Note } from "@prisma/client";
  import { Panel } from "@/components/ui/panel";
  import { formatDateTime } from "@/lib/format/date";
  import { NotebookText } from "lucide-react";
  import { NewNoteForm } from "./NewNoteForm";
  import { DeleteNoteButton } from "./DeleteNoteButton";

  export function NotesSection({ notes, patientId }: { notes: Note[]; patientId: string }) {
    return (
      <Panel eyebrow="Diário" title="Anotações" icon={NotebookText} padded={false}>
        <NewNoteForm patientId={patientId} />
        {notes.length === 0 ? (
          <p className="px-5 py-6 text-[13px] text-[var(--ink-4)]">Nenhuma anotação ainda.</p>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {notes.map((n) => (
              <article key={n.id} className="row-hover grid grid-cols-[1fr_auto] gap-3 px-5 py-3 items-start">
                <div>
                  <p className="text-[13.5px] text-[var(--ink-2)] whitespace-pre-wrap">{n.body}</p>
                  <p className="mt-1 text-[11.5px] text-[var(--ink-5)]">{formatDateTime(n.createdAt)}</p>
                </div>
                <DeleteNoteButton id={n.id} />
              </article>
            ))}
          </div>
        )}
      </Panel>
    );
  }
  ```
- [ ] **Step 7:** Create `src/app/(app)/pacientes/[id]/_components/BillingSection.tsx`:
  ```tsx
  import type { BillingEntry } from "@prisma/client";
  import { Panel } from "@/components/ui/panel";
  import { Badge } from "@/components/ui/badge";
  import { formatBRL } from "@/lib/format/currency";
  import { formatDate } from "@/lib/format/date";
  import { ReceiptText } from "lucide-react";

  export function BillingSection({ billing }: { billing: BillingEntry[] }) {
    return (
      <Panel eyebrow="Cobranças" title="Financeiro" icon={ReceiptText} padded={false}>
        {billing.length === 0 ? (
          <p className="px-5 py-6 text-[13px] text-[var(--ink-4)]">Sem entradas financeiras.</p>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {billing.map((b) => (
              <article key={b.id} className="row-hover grid grid-cols-[1fr_auto_auto] gap-3 px-5 py-3 items-center">
                <div>
                  <p className="metric-number text-[14px] font-semibold text-[var(--ink)]">{formatBRL(b.amountCents)}</p>
                  <p className="mt-0.5 text-[12.5px] text-[var(--ink-4)]">{b.serviceType} · {formatDate(b.serviceDate)}</p>
                </div>
                <Badge variant={b.paymentStatus === "PAGO" ? "success" : "warning"}>
                  {b.paymentStatus === "PAGO" ? "Pago" : "Pendente"}
                </Badge>
              </article>
            ))}
          </div>
        )}
      </Panel>
    );
  }
  ```
- [ ] **Step 8:** Run `npm run build`. Open a patient page in dev: sees sessões, prontuários, anotações (com form pra criar/apagar) e financeiro tudo numa scroll só, com âncoras no topo pra pular.
- [ ] **Step 9:** Commit `feat(patient): detail sections with sessions, records, notes, billing + new note form`.

---

## Phase 9 — Billing

### Task 9.1: Billing queries

**Files:** Create `src/server/queries/billing.ts`, `tests/integration/billing/queries.test.ts`.

- [ ] **Step 1:** Test:
  ```ts
  import { beforeEach, describe, expect, test } from "vitest";
  import { resetDb, testPrisma } from "../../helpers/db";
  import { hashPassword } from "@/lib/password";

  describe("billing queries", () => {
    let userId: string;
    beforeEach(async () => {
      await resetDb();
      const u = await testPrisma.user.create({
        data: { email: "u@t", passwordHash: await hashPassword("Abcdef12!"), name: "U", crp: "CRP" },
      });
      userId = u.id;
      const p = await testPrisma.patient.create({ data: { userId, name: "Ana", modality: "online" } });
      await testPrisma.billingEntry.createMany({
        data: [
          { userId, patientId: p.id, amountCents: 20000, serviceType: "S1", serviceDate: new Date("2026-05-10"), paymentStatus: "PAGO", paidAt: new Date("2026-05-10") },
          { userId, patientId: p.id, amountCents: 22000, serviceType: "S2", serviceDate: new Date("2026-05-15"), paymentStatus: "PENDENTE" },
          { userId, patientId: p.id, amountCents: 25000, serviceType: "S3", serviceDate: new Date("2026-05-20"), paymentStatus: "PENDENTE" },
        ],
      });
    });

    test("listBilling returns all entries by user", async () => {
      const { listBilling } = await import("@/server/queries/billing");
      const r = await listBilling(userId);
      expect(r.length).toBe(3);
    });

    test("billingTotals sums correctly", async () => {
      const { billingTotals } = await import("@/server/queries/billing");
      const r = await billingTotals(userId);
      expect(r.receivedCents).toBe(20000);
      expect(r.pendingCents).toBe(47000);
      expect(r.forecastCents).toBe(67000);
    });
  });
  ```
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Create `src/server/queries/billing.ts`:
  ```ts
  import { prisma } from "@/lib/db";
  import type { BillingEntry, Patient } from "@prisma/client";

  export type BillingWithPatient = BillingEntry & { patient: Patient };

  export async function listBilling(userId: string): Promise<BillingWithPatient[]> {
    return prisma.billingEntry.findMany({
      where: { userId },
      include: { patient: true },
      orderBy: { serviceDate: "desc" },
    });
  }

  export async function billingTotals(userId: string): Promise<{
    receivedCents: number;
    pendingCents: number;
    forecastCents: number;
  }> {
    const entries = await prisma.billingEntry.findMany({
      where: { userId },
      select: { amountCents: true, paymentStatus: true },
    });
    let received = 0;
    let pending = 0;
    for (const e of entries) {
      if (e.paymentStatus === "PAGO") received += e.amountCents;
      else pending += e.amountCents;
    }
    return { receivedCents: received, pendingCents: pending, forecastCents: received + pending };
  }

  export async function billingForPatient(userId: string, patientId: string): Promise<BillingEntry[]> {
    return prisma.billingEntry.findMany({
      where: { userId, patientId },
      orderBy: { serviceDate: "desc" },
    });
  }
  ```
- [ ] **Step 4:** Run tests. Expected: 2 PASS.
- [ ] **Step 5:** Commit `feat(billing): queries (list, totals, byPatient) + tests`.

---

### Task 9.2: `markPaid` action

**Files:** Create `src/server/actions/billing/markPaid.ts`, `tests/integration/billing/markPaid.test.ts`.

- [ ] **Step 1:** Test:
  ```ts
  import { beforeEach, describe, expect, test } from "vitest";
  import { resetDb, testPrisma } from "../../helpers/db";
  import { hashPassword } from "@/lib/password";

  describe("markPaid", () => {
    let userId: string;
    let billingId: string;
    let sessionId: string;

    beforeEach(async () => {
      await resetDb();
      const u = await testPrisma.user.create({
        data: { email: "u@t", passwordHash: await hashPassword("Abcdef12!"), name: "U", crp: "CRP" },
      });
      userId = u.id;
      const p = await testPrisma.patient.create({ data: { userId, name: "Ana", modality: "online" } });
      const s = await testPrisma.therapySession.create({
        data: {
          userId, patientId: p.id, modality: "online", location: "Link", amountCents: 20000,
          startsAt: new Date("2026-05-10T10:00:00-03:00"),
          endsAt: new Date("2026-05-10T10:50:00-03:00"),
        },
      });
      sessionId = s.id;
      const b = await testPrisma.billingEntry.create({
        data: { userId, patientId: p.id, sessionId: s.id, amountCents: 20000, serviceType: "S", serviceDate: s.startsAt },
      });
      billingId = b.id;
    });

    test("marks billing entry as paid and updates session", async () => {
      const { markPaidForUser } = await import("@/server/actions/billing/markPaid");
      const r = await markPaidForUser(userId, { billingId });
      expect(r.ok).toBe(true);
      const b = await testPrisma.billingEntry.findUnique({ where: { id: billingId } });
      expect(b!.paymentStatus).toBe("PAGO");
      expect(b!.paidAt).not.toBeNull();
      const s = await testPrisma.therapySession.findUnique({ where: { id: sessionId } });
      expect(s!.paymentStatus).toBe("PAGO");
    });

    test("rejects another user's billing", async () => {
      const other = await testPrisma.user.create({
        data: { email: "x@t", passwordHash: "x", name: "X", crp: "X" },
      });
      const { markPaidForUser } = await import("@/server/actions/billing/markPaid");
      const r = await markPaidForUser(other.id, { billingId });
      expect(r.ok).toBe(false);
    });
  });
  ```
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Create `src/server/actions/billing/markPaid.ts`:
  ```ts
  "use server";

  import { prisma } from "@/lib/db";
  import { requireUser } from "@/lib/auth-helpers";
  import { markPaidSchema } from "@/lib/validators/billing";
  import { actionError, actionOk, fromZodError, type ActionResult } from "@/lib/action-result";
  import { revalidatePath } from "next/cache";
  import type { BillingEntry } from "@prisma/client";

  export async function markPaidForUser(userId: string, input: unknown): Promise<ActionResult<BillingEntry>> {
    const parsed = markPaidSchema.safeParse(input);
    if (!parsed.success) return fromZodError(parsed.error);
    const billing = await prisma.billingEntry.findFirst({ where: { id: parsed.data.billingId, userId } });
    if (!billing) return actionError("Cobrança não encontrada.");
    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.billingEntry.update({
        where: { id: billing.id },
        data: { paymentStatus: "PAGO", paidAt: new Date() },
      });
      if (billing.sessionId) {
        await tx.therapySession.update({
          where: { id: billing.sessionId },
          data: { paymentStatus: "PAGO" },
        });
      }
      return b;
    });
    return actionOk(updated);
  }

  export async function markPaid(input: unknown): Promise<ActionResult<BillingEntry>> {
    const user = await requireUser();
    const r = await markPaidForUser(user.id, input);
    if (r.ok) {
      revalidatePath("/financeiro");
      revalidatePath("/");
    }
    return r;
  }
  ```
- [ ] **Step 4:** Run tests. Expected: 2 PASS.
- [ ] **Step 5:** Commit `feat(billing): markPaid action with session sync + tests`.

---

### Task 9.3: Migrate `/financeiro` to DB

**Files:** Replace `src/app/(app)/financeiro/page.tsx`. Create `src/app/(app)/financeiro/_components/{FinanceView,MarkPaidButton}.tsx`.

- [ ] **Step 1:** Replace `src/app/(app)/financeiro/page.tsx`:
  ```tsx
  import { Banknote, ReceiptText, TrendingUp, WalletCards } from "lucide-react";
  import { requireUser } from "@/lib/auth-helpers";
  import { listBilling, billingTotals } from "@/server/queries/billing";
  import { StatCard } from "@/components/ui/stat-card";
  import { Panel } from "@/components/ui/panel";
  import { Badge } from "@/components/ui/badge";
  import { formatBRL } from "@/lib/format/currency";
  import { formatDate } from "@/lib/format/date";
  import { MarkPaidButton } from "./_components/MarkPaidButton";

  export const dynamic = "force-dynamic";

  export default async function FinanceiroPage() {
    const user = await requireUser();
    const [entries, totals] = await Promise.all([listBilling(user.id), billingTotals(user.id)]);

    return (
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
        <div className="mb-6">
          <p className="label">Financeiro</p>
          <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-[var(--ink)]">Recebimentos e cobranças</h2>
        </div>
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Banknote} label="Recebido" value={formatBRL(totals.receivedCents)} detail="Pagamentos confirmados" />
          <StatCard icon={WalletCards} label="Pendente" value={formatBRL(totals.pendingCents)} detail="Aguardando pagamento" />
          <StatCard icon={TrendingUp} label="Previsto" value={formatBRL(totals.forecastCents)} detail="Recebido + pendente" />
          <StatCard icon={ReceiptText} label="Entradas" value={entries.length.toString()} detail="Total registrado" />
        </section>

        <div className="mt-6">
          <Panel eyebrow="Atendimentos" title="Cobranças" icon={WalletCards} padded={false}>
            <div className="grid grid-cols-[1.2fr_0.85fr_0.7fr_auto] border-b border-[var(--border)] bg-[var(--surface-2)] px-5 py-2.5 max-lg:hidden">
              <span className="label-strong">Paciente</span>
              <span className="label-strong">Valor</span>
              <span className="label-strong">Pagamento</span>
              <span className="label-strong">Ações</span>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {entries.map((e) => (
                <article key={e.id} className="row-hover grid grid-cols-1 gap-3 px-5 py-4 lg:grid-cols-[1.2fr_0.85fr_0.7fr_auto] lg:items-center">
                  <div>
                    <p className="text-[14px] font-semibold text-[var(--ink)]">{e.patient.name}</p>
                    <p className="mt-0.5 text-[12.5px] text-[var(--ink-4)]">{e.serviceType} · {formatDate(e.serviceDate)}</p>
                  </div>
                  <p className="metric-number text-[15px] font-semibold text-[var(--ink)]">{formatBRL(e.amountCents)}</p>
                  <Badge variant={e.paymentStatus === "PAGO" ? "success" : "warning"}>
                    {e.paymentStatus === "PAGO" ? "Pago" : "Pendente"}
                  </Badge>
                  <div>{e.paymentStatus === "PENDENTE" ? <MarkPaidButton billingId={e.id} /> : null}</div>
                </article>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    );
  }
  ```
- [ ] **Step 2:** Create `src/app/(app)/financeiro/_components/MarkPaidButton.tsx`:
  ```tsx
  "use client";

  import { useTransition } from "react";
  import { useRouter } from "next/navigation";
  import { markPaid } from "@/server/actions/billing/markPaid";

  export function MarkPaidButton({ billingId }: { billingId: string }) {
    const router = useRouter();
    const [pending, start] = useTransition();
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => { await markPaid({ billingId }); router.refresh(); })}
        className="btn btn-secondary btn-sm"
      >
        {pending ? "Salvando..." : "Marcar pago"}
      </button>
    );
  }
  ```
- [ ] **Step 3:** Run `npm run build`. Hit `/financeiro` in dev — totals come from DB; click "Marcar pago" on a pending entry — UI updates.
- [ ] **Step 4:** Commit `feat(billing): /financeiro reads from DB with markPaid action`.

---

## Phase 10 — Home "Hoje"

### Task 10.1: Stats query

**Files:** Create `src/server/queries/stats.ts`.

- [ ] **Step 1:** Create `src/server/queries/stats.ts`:
  ```ts
  import { prisma } from "@/lib/db";

  export type TodayStats = {
    todaySessionsCount: number;
    confirmedToday: number;
    activePatients: number;
    pendingPayments: number;
    pendingRecords: number;
    attendanceRate: number;
  };

  export async function getTodayStats(userId: string, today: Date = new Date()): Promise<TodayStats> {
    const dayStart = new Date(today); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(today); dayEnd.setHours(23, 59, 59, 999);

    const [
      todaySessionsCount,
      confirmedToday,
      activePatients,
      pendingPayments,
      pendingRecords,
      concluded,
      present,
    ] = await Promise.all([
      prisma.therapySession.count({ where: { userId, startsAt: { gte: dayStart, lte: dayEnd } } }),
      prisma.therapySession.count({
        where: { userId, startsAt: { gte: dayStart, lte: dayEnd }, confirmationStatus: "confirmed" },
      }),
      prisma.patient.count({ where: { userId, archived: false } }),
      prisma.billingEntry.count({ where: { userId, paymentStatus: "PENDENTE" } }),
      prisma.therapySession.count({
        where: { userId, status: "CONCLUIDA", documentationStatus: { not: "complete" } },
      }),
      prisma.therapySession.count({ where: { userId, status: "CONCLUIDA" } }),
      prisma.therapySession.count({ where: { userId, attendanceStatus: "present" } }),
    ]);

    const attendanceRate = concluded === 0 ? 0 : Math.round((present / concluded) * 100);

    return {
      todaySessionsCount,
      confirmedToday,
      activePatients,
      pendingPayments,
      pendingRecords,
      attendanceRate,
    };
  }
  ```
- [ ] **Step 2:** Commit `feat(stats): getTodayStats query`.

---

### Task 10.2: New `/` page (Hoje)

**Files:** Replace `src/app/(app)/page.tsx`. Create `src/app/(app)/_components/TodayHeader.tsx`, `TodayList.tsx`.

- [ ] **Step 1:** Replace `src/app/(app)/page.tsx`:
  ```tsx
  import { CalendarClock, FileCheck2, UsersRound, WalletCards, FileText } from "lucide-react";
  import { requireUser } from "@/lib/auth-helpers";
  import { getTodayStats } from "@/server/queries/stats";
  import { listSessionsOnDate } from "@/server/queries/session";
  import { StatCard } from "@/components/ui/stat-card";
  import { Panel } from "@/components/ui/panel";
  import { formatTime } from "@/lib/format/date";
  import { Badge } from "@/components/ui/badge";
  import Link from "next/link";

  export const dynamic = "force-dynamic";

  export default async function HojePage() {
    const user = await requireUser();
    const today = new Date();
    const [stats, todaySessions] = await Promise.all([
      getTodayStats(user.id, today),
      listSessionsOnDate(user.id, today),
    ]);

    const niceDate = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(today);

    return (
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
        <div className="mb-6">
          <p className="label">Hoje · {niceDate.charAt(0).toUpperCase() + niceDate.slice(1)}</p>
          <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-[var(--ink)]">
            Olá, {user.name.split(" ")[0]}
          </h2>
          <p className="mt-1 text-[13px] text-[var(--ink-4)]">
            {stats.todaySessionsCount} {stats.todaySessionsCount === 1 ? "sessão hoje" : "sessões hoje"} ·
            {" "}{stats.pendingRecords} prontuários abertos · {stats.pendingPayments} cobranças pendentes
          </p>
        </div>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={CalendarClock} label="Sessões hoje" value={String(stats.todaySessionsCount)} detail={`${stats.confirmedToday} confirmadas`} />
          <StatCard icon={UsersRound} label="Pacientes ativos" value={String(stats.activePatients)} detail="Em acompanhamento" />
          <StatCard icon={WalletCards} label="Cobranças pendentes" value={String(stats.pendingPayments)} detail="Aguardando pagamento" />
          <StatCard icon={FileCheck2} label="Presença" value={`${stats.attendanceRate}%`} detail="Atendimentos concluídos" />
        </section>

        <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Panel eyebrow="Agenda do dia" title="Sessões de hoje" icon={CalendarClock} padded={false} action={{ label: "Ver agenda", href: "/agenda" }}>
            {todaySessions.length === 0 ? (
              <p className="px-5 py-8 text-center text-[13px] text-[var(--ink-4)]">Nenhuma sessão agendada para hoje.</p>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {todaySessions.map((s) => (
                  <article key={s.id} className="row-hover grid grid-cols-[78px_1fr_auto] gap-3 px-5 py-4 items-center">
                    <p className="metric-number text-[15px] font-semibold text-[var(--ink)]">{formatTime(s.startsAt)}</p>
                    <div className="min-w-0">
                      <Link href={`/agenda/${s.id}`} className="text-[14px] font-semibold text-[var(--ink)] hover:text-[var(--blue)]">
                        {s.patient.name}
                      </Link>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <Badge variant={s.confirmationStatus === "confirmed" ? "success" : "warning"}>
                          {s.confirmationStatus === "confirmed" ? "Confirmada" : "Aguardando"}
                        </Badge>
                        <Badge variant={s.paymentStatus === "PAGO" ? "success" : "warning"}>
                          {s.paymentStatus === "PAGO" ? "Pago" : "Pendente"}
                        </Badge>
                      </div>
                    </div>
                    <Link href={`/agenda/${s.id}`} className="btn btn-primary btn-sm">Atender</Link>
                  </article>
                ))}
              </div>
            )}
          </Panel>

          <aside className="space-y-5">
            <Panel eyebrow="Pendências" title="A fazer" icon={FileText}>
              <ul className="space-y-2 text-[13.5px]">
                {stats.pendingRecords > 0 ? (
                  <li className="flex items-center justify-between">
                    <span>Prontuários abertos</span>
                    <Link href="/prontuarios" className="text-[var(--blue)] hover:underline">
                      {stats.pendingRecords}
                    </Link>
                  </li>
                ) : null}
                {stats.pendingPayments > 0 ? (
                  <li className="flex items-center justify-between">
                    <span>Cobranças pendentes</span>
                    <Link href="/financeiro" className="text-[var(--blue)] hover:underline">
                      {stats.pendingPayments}
                    </Link>
                  </li>
                ) : null}
                {stats.pendingRecords === 0 && stats.pendingPayments === 0 ? (
                  <li className="text-[var(--ink-4)]">Tudo em dia. ✨</li>
                ) : null}
              </ul>
            </Panel>
          </aside>
        </div>
      </div>
    );
  }
  ```
- [ ] **Step 2:** Run `npm run build`. Hit `/` in dev — should show real stats, today's sessions list, pendências derived from queries.
- [ ] **Step 3:** Commit `feat(home): /hoje page with real stats + today's sessions + pendências`.

---

## Phase 11 — Compliance

### Task 11.1: Refactor `/compliance` to static + dynamic last-review

**Files:** Replace `src/app/(app)/compliance/page.tsx`.

- [ ] **Step 1:** Replace `src/app/(app)/compliance/page.tsx`:
  ```tsx
  import { ShieldCheck } from "lucide-react";
  import { requireUser } from "@/lib/auth-helpers";
  import { Panel } from "@/components/ui/panel";
  import { ComplianceItem } from "@/components/features/compliance-item";
  import { Badge } from "@/components/ui/badge";
  import { formatDate } from "@/lib/format/date";

  export const dynamic = "force-dynamic";

  const ITEMS = [
    "Dados clínicos ficam apenas no dashboard web.",
    "Mensagens de WhatsApp ficam fora do app — só o número como contato.",
    "Prontuários DAP e BIRP são autorais e sem redação por IA.",
    "Arquivamento preserva registros por 5 anos (retenção obrigatória).",
    "Cobranças e recibos ficam vinculados ao atendimento.",
    "Conta única por instância (single-tenant); senhas com bcrypt.",
  ];

  export default async function CompliancePage() {
    const user = await requireUser();
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-8">
        <div className="mb-6">
          <p className="label">Compliance</p>
          <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-[var(--ink)]">CFP e segurança</h2>
          <p className="mt-1 text-[13px] text-[var(--ink-4)]">Princípios regulatórios aplicados em todo o sistema.</p>
        </div>
        <Panel eyebrow="Regras vigentes" title="Conformidade do sistema" icon={ShieldCheck}>
          <div className="mb-4 flex items-center gap-2">
            <Badge variant="success">Em conformidade</Badge>
            <span className="text-[12.5px] text-[var(--ink-4)]">
              Conta criada em {formatDate(user.createdAt)} · CRP {user.crp}
            </span>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {ITEMS.map((text) => <ComplianceItem key={text} text={text} />)}
          </div>
          <div className="mt-6 rounded-md border border-[#cddfff] bg-[var(--blue-soft)] p-4">
            <p className="text-[13px] font-semibold text-[var(--blue-text)]">Política da Clínica IA</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--blue-text)]">
              Sem agente IA, sem automações de mensageria. O sistema só guarda dados que você inseriu manualmente.
              Prontuários são autorais e mantidos por no mínimo cinco anos.
            </p>
          </div>
        </Panel>
      </div>
    );
  }
  ```
- [ ] **Step 2:** Run `npm run build`. Page renders with text from spec.
- [ ] **Step 3:** Commit `feat(compliance): rewrite copy to match new no-AI scope`.

---

## Phase 12 — Password recovery

### Task 12.1: Email sender abstraction

**Files:** Create `src/lib/email.ts`, `tests/unit/email.test.ts`.

- [ ] **Step 1:** Test:
  ```ts
  import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
  import { sendEmail, __setSender, __resetSender } from "@/lib/email";

  describe("email", () => {
    afterEach(() => __resetSender());

    test("calls the injected sender with rendered payload", async () => {
      const calls: unknown[] = [];
      __setSender(async (payload) => { calls.push(payload); });
      await sendEmail({ to: "a@b", subject: "Hi", html: "<p>Hi</p>" });
      expect(calls).toHaveLength(1);
      expect(calls[0]).toMatchObject({ to: "a@b", subject: "Hi" });
    });

    test("falls back to console.log when no API key and no override", async () => {
      const spy = vi.spyOn(console, "log").mockImplementation(() => {});
      delete process.env.RESEND_API_KEY;
      __resetSender();
      await sendEmail({ to: "a@b", subject: "Hi", html: "<p>Hi</p>" });
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });
  ```
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Create `src/lib/email.ts`:
  ```ts
  import { Resend } from "resend";

  export type EmailPayload = { to: string; subject: string; html: string };
  export type EmailSender = (payload: EmailPayload) => Promise<void>;

  const consoleSender: EmailSender = async (p) => {
    console.log("\n[email:dev]", `to=${p.to}`, `subject=${p.subject}`);
    console.log(p.html, "\n");
  };

  let override: EmailSender | null = null;

  /** Used by tests to inject a mock sender. */
  export function __setSender(sender: EmailSender) {
    override = sender;
  }
  /** Restores default behavior. */
  export function __resetSender() {
    override = null;
  }

  function defaultSender(): EmailSender {
    if (!process.env.RESEND_API_KEY) return consoleSender;
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.EMAIL_FROM ?? "Clínica IA <no-reply@clinicaia.local>";
    return async ({ to, subject, html }) => {
      await resend.emails.send({ from, to, subject, html });
    };
  }

  export async function sendEmail(payload: EmailPayload): Promise<void> {
    const sender = override ?? defaultSender();
    await sender(payload);
  }
  ```
- [ ] **Step 4:** Run tests. Expected: 2 PASS.
- [ ] **Step 5:** Commit `feat(email): sender abstraction with Resend + console fallback`.

---

### Task 12.2: `requestPasswordReset` action

**Files:** Create `src/server/actions/auth/requestPasswordReset.ts`, `tests/integration/auth/requestPasswordReset.test.ts`.

- [ ] **Step 1:** Test:
  ```ts
  import { beforeEach, describe, expect, test } from "vitest";
  import { resetDb, testPrisma } from "../../helpers/db";
  import { hashPassword } from "@/lib/password";
  import { __setSender, __resetSender } from "@/lib/email";

  describe("requestPasswordReset", () => {
    beforeEach(async () => {
      await resetDb();
      await testPrisma.user.create({
        data: {
          email: "marina@test.local",
          passwordHash: await hashPassword("Old123Pass!"),
          name: "Marina", crp: "CRP 06/000",
        },
      });
    });

    test("creates a token and sends email for existing user", async () => {
      const sent: { to: string; html: string }[] = [];
      __setSender(async (p) => { sent.push({ to: p.to, html: p.html }); });
      const { requestPasswordReset } = await import("@/server/actions/auth/requestPasswordReset");
      const r = await requestPasswordReset({ email: "marina@test.local" });
      expect(r.ok).toBe(true);
      expect(await testPrisma.passwordResetToken.count()).toBe(1);
      expect(sent[0].to).toBe("marina@test.local");
      expect(sent[0].html).toMatch(/redefinir-senha\?token=/);
      __resetSender();
    });

    test("returns success even for unknown email (no enumeration)", async () => {
      __setSender(async () => {});
      const { requestPasswordReset } = await import("@/server/actions/auth/requestPasswordReset");
      const r = await requestPasswordReset({ email: "nobody@x.com" });
      expect(r.ok).toBe(true);
      expect(await testPrisma.passwordResetToken.count()).toBe(0);
      __resetSender();
    });

    test("rejects invalid email format", async () => {
      const { requestPasswordReset } = await import("@/server/actions/auth/requestPasswordReset");
      const r = await requestPasswordReset({ email: "not-email" });
      expect(r.ok).toBe(false);
    });
  });
  ```
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Create `src/server/actions/auth/requestPasswordReset.ts`:
  ```ts
  "use server";

  import crypto from "node:crypto";
  import { prisma } from "@/lib/db";
  import { sendEmail } from "@/lib/email";
  import { requestResetSchema, type RequestResetInput } from "@/lib/validators/auth";
  import { actionOk, fromZodError, type ActionResult } from "@/lib/action-result";

  function hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  export async function requestPasswordReset(input: RequestResetInput): Promise<ActionResult<void>> {
    const parsed = requestResetSchema.safeParse(input);
    if (!parsed.success) return fromZodError(parsed.error);

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user) return actionOk(undefined);  // no enumeration

    const raw = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await prisma.passwordResetToken.create({
      data: { userId: user.id, token: hashToken(raw), expiresAt: expires },
    });

    const url = `${process.env.AUTH_URL ?? "http://localhost:3000"}/redefinir-senha?token=${raw}`;
    await sendEmail({
      to: user.email,
      subject: "Redefinir senha — Clínica IA",
      html: `
        <p>Olá ${user.name.split(" ")[0]},</p>
        <p>Use o link abaixo para definir uma nova senha. Ele expira em 1 hora.</p>
        <p><a href="${url}">${url}</a></p>
        <p>Se você não pediu isso, ignore este email.</p>
      `,
    });

    return actionOk(undefined);
  }
  ```
- [ ] **Step 4:** Run tests. Expected: 3 PASS.
- [ ] **Step 5:** Commit `feat(auth): requestPasswordReset action with hashed token + email`.

---

### Task 12.3: `resetPassword` action

**Files:** Create `src/server/actions/auth/resetPassword.ts`, `tests/integration/auth/resetPassword.test.ts`.

- [ ] **Step 1:** Test:
  ```ts
  import { beforeEach, describe, expect, test } from "vitest";
  import crypto from "node:crypto";
  import { resetDb, testPrisma } from "../../helpers/db";
  import { hashPassword, verifyPassword } from "@/lib/password";

  function hashToken(t: string) { return crypto.createHash("sha256").update(t).digest("hex"); }

  describe("resetPassword", () => {
    let userId: string;
    let rawToken: string;

    beforeEach(async () => {
      await resetDb();
      const u = await testPrisma.user.create({
        data: { email: "u@t", passwordHash: await hashPassword("Old1Pass!"), name: "U", crp: "CRP" },
      });
      userId = u.id;
      rawToken = crypto.randomBytes(32).toString("hex");
      await testPrisma.passwordResetToken.create({
        data: { userId, token: hashToken(rawToken), expiresAt: new Date(Date.now() + 60000) },
      });
    });

    test("sets new password, marks token used, invalidates auth sessions", async () => {
      // Pre-existing auth session
      await testPrisma.authSession.create({
        data: { userId, sessionToken: "abc", expires: new Date(Date.now() + 86400000) },
      });
      const { resetPassword } = await import("@/server/actions/auth/resetPassword");
      const r = await resetPassword({
        token: rawToken,
        password: "NewPass1!",
        confirmPassword: "NewPass1!",
      });
      expect(r.ok).toBe(true);
      const u = await testPrisma.user.findUnique({ where: { id: userId } });
      expect(await verifyPassword("NewPass1!", u!.passwordHash)).toBe(true);
      const used = await testPrisma.passwordResetToken.findFirst({ where: { userId } });
      expect(used!.usedAt).not.toBeNull();
      expect(await testPrisma.authSession.count()).toBe(0);
    });

    test("rejects already-used token", async () => {
      await testPrisma.passwordResetToken.updateMany({ where: { userId }, data: { usedAt: new Date() } });
      const { resetPassword } = await import("@/server/actions/auth/resetPassword");
      const r = await resetPassword({ token: rawToken, password: "NewPass1!", confirmPassword: "NewPass1!" });
      expect(r.ok).toBe(false);
    });

    test("rejects expired token", async () => {
      await testPrisma.passwordResetToken.updateMany({ where: { userId }, data: { expiresAt: new Date(Date.now() - 1000) } });
      const { resetPassword } = await import("@/server/actions/auth/resetPassword");
      const r = await resetPassword({ token: rawToken, password: "NewPass1!", confirmPassword: "NewPass1!" });
      expect(r.ok).toBe(false);
    });

    test("rejects mismatched confirmation", async () => {
      const { resetPassword } = await import("@/server/actions/auth/resetPassword");
      const r = await resetPassword({ token: rawToken, password: "NewPass1!", confirmPassword: "Different!" });
      expect(r.ok).toBe(false);
    });
  });
  ```
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Create `src/server/actions/auth/resetPassword.ts`:
  ```ts
  "use server";

  import crypto from "node:crypto";
  import { prisma } from "@/lib/db";
  import { hashPassword } from "@/lib/password";
  import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validators/auth";
  import { actionError, actionOk, fromZodError, type ActionResult } from "@/lib/action-result";

  function hashToken(t: string) { return crypto.createHash("sha256").update(t).digest("hex"); }

  export async function resetPassword(input: ResetPasswordInput): Promise<ActionResult<void>> {
    const parsed = resetPasswordSchema.safeParse(input);
    if (!parsed.success) return fromZodError(parsed.error);

    const record = await prisma.passwordResetToken.findUnique({
      where: { token: hashToken(parsed.data.token) },
    });
    if (!record) return actionError("Link inválido.");
    if (record.usedAt) return actionError("Link já utilizado.");
    if (record.expiresAt < new Date()) return actionError("Link expirado.");

    const hash = await hashPassword(parsed.data.password);
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash: hash } }),
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      prisma.authSession.deleteMany({ where: { userId: record.userId } }),
    ]);
    return actionOk(undefined);
  }
  ```
- [ ] **Step 4:** Run tests. Expected: 4 PASS.
- [ ] **Step 5:** Commit `feat(auth): resetPassword action with token validation + session invalidation`.

---

### Task 12.4: `/esqueci-senha` page

**Files:** Create `src/app/(auth)/esqueci-senha/page.tsx`, `forgot-form.tsx`.

- [ ] **Step 1:** Create `src/app/(auth)/esqueci-senha/forgot-form.tsx`:
  ```tsx
  "use client";

  import { useState, useTransition } from "react";
  import Link from "next/link";
  import { requestPasswordReset } from "@/server/actions/auth/requestPasswordReset";

  export function ForgotForm() {
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pending, start] = useTransition();

    function onSubmit(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const email = String(fd.get("email") ?? "");
      start(async () => {
        const r = await requestPasswordReset({ email });
        if (r.ok) setSent(true); else setError(r.error);
      });
    }

    if (sent) {
      return (
        <div className="card p-6 space-y-3">
          <p className="text-[14px] text-[var(--ink-2)]">
            Se o email existir na nossa base, enviamos um link para redefinir a senha. Verifique sua caixa de entrada.
          </p>
          <Link href="/login" className="text-[13px] text-[var(--blue)] hover:underline">Voltar para o login</Link>
        </div>
      );
    }

    return (
      <form onSubmit={onSubmit} className="card p-6 space-y-4">
        <p className="text-[13px] text-[var(--ink-3)]">
          Digite seu email. Você receberá um link para definir uma nova senha.
        </p>
        <div>
          <label htmlFor="email" className="label-strong block mb-1">Email</label>
          <input id="email" name="email" type="email" required className="input" />
        </div>
        {error ? (
          <div role="alert" className="rounded-md border border-[#f3bcbc] bg-[var(--danger-soft)] p-3 text-[13px] text-[var(--danger-text)]">{error}</div>
        ) : null}
        <button type="submit" disabled={pending} className="btn btn-primary w-full">
          {pending ? "Enviando..." : "Enviar link"}
        </button>
        <div className="pt-2 text-center">
          <Link href="/login" className="text-[13px] text-[var(--blue)] hover:underline">Voltar para o login</Link>
        </div>
      </form>
    );
  }
  ```
- [ ] **Step 2:** Create `src/app/(auth)/esqueci-senha/page.tsx`:
  ```tsx
  import { ForgotForm } from "./forgot-form";

  export default function EsqueciSenhaPage() {
    return <ForgotForm />;
  }
  ```
- [ ] **Step 3:** Verify build + manual flow: open `/esqueci-senha`, submit known email, check console for the magic link in dev.
- [ ] **Step 4:** Commit `feat(auth): /esqueci-senha page wired to requestPasswordReset`.

---

### Task 12.5: `/redefinir-senha` page

**Files:** Create `src/app/(auth)/redefinir-senha/page.tsx`, `reset-form.tsx`.

- [ ] **Step 1:** Create `src/app/(auth)/redefinir-senha/reset-form.tsx`:
  ```tsx
  "use client";

  import { useState, useTransition } from "react";
  import { useRouter, useSearchParams } from "next/navigation";
  import { resetPassword } from "@/server/actions/auth/resetPassword";

  export function ResetForm() {
    const router = useRouter();
    const sp = useSearchParams();
    const token = sp.get("token") ?? "";
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [pending, start] = useTransition();

    function onSubmit(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault();
      setError(null);
      setFieldErrors({});
      const fd = new FormData(e.currentTarget);
      const password = String(fd.get("password") ?? "");
      const confirmPassword = String(fd.get("confirmPassword") ?? "");
      start(async () => {
        const r = await resetPassword({ token, password, confirmPassword });
        if (r.ok) router.replace("/login?reset=ok");
        else {
          setError(r.error);
          setFieldErrors(r.fieldErrors ?? {});
        }
      });
    }

    if (!token) {
      return (
        <div className="card p-6 text-[13px] text-[var(--danger-text)]">
          Link inválido. Solicite um novo em /esqueci-senha.
        </div>
      );
    }

    return (
      <form onSubmit={onSubmit} className="card p-6 space-y-4">
        <div>
          <label htmlFor="password" className="label-strong block mb-1">Nova senha</label>
          <input id="password" name="password" type="password" required minLength={8} className="input" />
          {fieldErrors.password ? <p className="mt-1 text-[12px] text-[var(--danger)]">{fieldErrors.password[0]}</p> : null}
        </div>
        <div>
          <label htmlFor="confirmPassword" className="label-strong block mb-1">Confirmar</label>
          <input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} className="input" />
          {fieldErrors.confirmPassword ? <p className="mt-1 text-[12px] text-[var(--danger)]">{fieldErrors.confirmPassword[0]}</p> : null}
        </div>
        {error ? (
          <div role="alert" className="rounded-md border border-[#f3bcbc] bg-[var(--danger-soft)] p-3 text-[13px] text-[var(--danger-text)]">{error}</div>
        ) : null}
        <button type="submit" disabled={pending} className="btn btn-primary w-full">
          {pending ? "Salvando..." : "Definir nova senha"}
        </button>
      </form>
    );
  }
  ```
- [ ] **Step 2:** Create `src/app/(auth)/redefinir-senha/page.tsx`:
  ```tsx
  import { Suspense } from "react";
  import { ResetForm } from "./reset-form";

  export const dynamic = "force-dynamic";

  export default function RedefinirSenhaPage() {
    return (
      <Suspense fallback={null}>
        <ResetForm />
      </Suspense>
    );
  }
  ```
- [ ] **Step 3:** Optional small touch: when user lands on `/login?reset=ok`, show a success banner. Edit `src/app/(auth)/login/login-form.tsx` and read `sp.get("reset")` near the top; if `"ok"`, render a `<div className="rounded-md border border-[color:var(--success)]/40 bg-[var(--success-soft)] p-3 text-[13px] text-[var(--success-text)] mb-3">Senha atualizada. Faça login.</div>` above the form.
- [ ] **Step 4:** Manual flow: request reset, copy console link, open it, set new password, log in with it.
- [ ] **Step 5:** Commit `feat(auth): /redefinir-senha page + reset success banner on /login`.

---

## Phase 13 — Configurações

### Task 13.1: `updateProfile` and `changePassword` actions

**Files:** Create `src/server/actions/settings/{updateProfile,changePassword}.ts`, `tests/integration/settings/settings.test.ts`.

- [ ] **Step 1:** Test:
  ```ts
  import { beforeEach, describe, expect, test } from "vitest";
  import { resetDb, testPrisma } from "../../helpers/db";
  import { hashPassword, verifyPassword } from "@/lib/password";

  describe("settings actions", () => {
    let userId: string;
    beforeEach(async () => {
      await resetDb();
      const u = await testPrisma.user.create({
        data: { email: "u@t", passwordHash: await hashPassword("CurrPass1!"), name: "U", crp: "CRP" },
      });
      userId = u.id;
    });

    test("updateProfile updates allowed fields", async () => {
      const { updateProfileForUser } = await import("@/server/actions/settings/updateProfile");
      const r = await updateProfileForUser(userId, {
        name: "Dra. Marina Azevedo",
        crp: "CRP 06/123456",
        city: "São Paulo",
        phone: "+5511999990000",
        defaultSessionPriceCents: 25000,
      });
      expect(r.ok).toBe(true);
      const u = await testPrisma.user.findUnique({ where: { id: userId } });
      expect(u!.city).toBe("São Paulo");
      expect(u!.defaultSessionPriceCents).toBe(25000);
    });

    test("changePassword fails if current wrong", async () => {
      const { changePasswordForUser } = await import("@/server/actions/settings/changePassword");
      const r = await changePasswordForUser(userId, {
        currentPassword: "wrong",
        newPassword: "NewPass1!",
        confirmPassword: "NewPass1!",
      });
      expect(r.ok).toBe(false);
    });

    test("changePassword updates hash on success", async () => {
      const { changePasswordForUser } = await import("@/server/actions/settings/changePassword");
      const r = await changePasswordForUser(userId, {
        currentPassword: "CurrPass1!",
        newPassword: "NewPass1!",
        confirmPassword: "NewPass1!",
      });
      expect(r.ok).toBe(true);
      const u = await testPrisma.user.findUnique({ where: { id: userId } });
      expect(await verifyPassword("NewPass1!", u!.passwordHash)).toBe(true);
    });
  });
  ```
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Create `src/server/actions/settings/updateProfile.ts`:
  ```ts
  "use server";

  import { prisma } from "@/lib/db";
  import { requireUser } from "@/lib/auth-helpers";
  import { updateProfileSchema, type UpdateProfileInput } from "@/lib/validators/settings";
  import { actionOk, fromZodError, type ActionResult } from "@/lib/action-result";
  import { revalidatePath } from "next/cache";
  import type { User } from "@prisma/client";

  export async function updateProfileForUser(userId: string, input: UpdateProfileInput): Promise<ActionResult<User>> {
    const parsed = updateProfileSchema.safeParse(input);
    if (!parsed.success) return fromZodError(parsed.error);
    const u = await prisma.user.update({ where: { id: userId }, data: parsed.data });
    return actionOk(u);
  }

  export async function updateProfile(input: UpdateProfileInput): Promise<ActionResult<User>> {
    const user = await requireUser();
    const r = await updateProfileForUser(user.id, input);
    if (r.ok) revalidatePath("/configuracoes");
    return r;
  }
  ```
- [ ] **Step 4:** Create `src/server/actions/settings/changePassword.ts`:
  ```ts
  "use server";

  import { prisma } from "@/lib/db";
  import { requireUser } from "@/lib/auth-helpers";
  import { hashPassword, verifyPassword } from "@/lib/password";
  import { changePasswordSchema, type ChangePasswordInput } from "@/lib/validators/auth";
  import { actionError, actionOk, fromZodError, type ActionResult } from "@/lib/action-result";

  export async function changePasswordForUser(userId: string, input: ChangePasswordInput): Promise<ActionResult<void>> {
    const parsed = changePasswordSchema.safeParse(input);
    if (!parsed.success) return fromZodError(parsed.error);
    const u = await prisma.user.findUnique({ where: { id: userId } });
    if (!u) return actionError("Conta não encontrada.");
    if (!(await verifyPassword(parsed.data.currentPassword, u.passwordHash))) {
      return actionError("Senha atual incorreta.");
    }
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(parsed.data.newPassword) },
    });
    return actionOk(undefined);
  }

  export async function changePassword(input: ChangePasswordInput): Promise<ActionResult<void>> {
    const user = await requireUser();
    return changePasswordForUser(user.id, input);
  }
  ```
- [ ] **Step 5:** Run tests. Expected: 3 PASS.
- [ ] **Step 6:** Commit `feat(settings): updateProfile + changePassword actions + tests`.

---

### Task 13.2: `/configuracoes` page

**Files:** Create `src/app/(app)/configuracoes/page.tsx`, `_components/ProfileForm.tsx`, `_components/PasswordForm.tsx`, `_components/LogoutButton.tsx`.

- [ ] **Step 1:** Create `src/app/(app)/configuracoes/_components/ProfileForm.tsx`:
  ```tsx
  "use client";

  import { useState, useTransition } from "react";
  import type { User } from "@prisma/client";
  import { updateProfile } from "@/server/actions/settings/updateProfile";

  export function ProfileForm({ user }: { user: User }) {
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [topError, setTopError] = useState<string | null>(null);
    const [savedAt, setSavedAt] = useState<Date | null>(null);
    const [pending, start] = useTransition();

    function onSubmit(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault();
      setErrors({});
      setTopError(null);
      const fd = new FormData(e.currentTarget);
      const amount = Number(fd.get("price") ?? user.defaultSessionPriceCents / 100);
      start(async () => {
        const r = await updateProfile({
          name: String(fd.get("name") ?? ""),
          crp: String(fd.get("crp") ?? ""),
          city: String(fd.get("city") ?? "") || undefined,
          phone: String(fd.get("phone") ?? "") || undefined,
          defaultSessionPriceCents: Math.round(amount * 100),
        });
        if (r.ok) setSavedAt(new Date());
        else { setErrors(r.fieldErrors ?? {}); setTopError(r.error); }
      });
    }

    return (
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Nome" name="name" defaultValue={user.name} required err={errors.name?.[0]} />
        <Field label="CRP" name="crp" defaultValue={user.crp} required err={errors.crp?.[0]} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Cidade" name="city" defaultValue={user.city ?? ""} err={errors.city?.[0]} />
          <Field label="Telefone" name="phone" defaultValue={user.phone ?? ""} err={errors.phone?.[0]} />
        </div>
        <Field
          label="Valor padrão da sessão (R$)"
          name="price"
          type="number"
          defaultValue={(user.defaultSessionPriceCents / 100).toFixed(2)}
          err={errors.defaultSessionPriceCents?.[0]}
        />
        {topError ? <p className="text-[13px] text-[var(--danger-text)]">{topError}</p> : null}
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-[var(--ink-5)]">{savedAt ? `Salvo às ${savedAt.toLocaleTimeString("pt-BR")}` : ""}</span>
          <button type="submit" disabled={pending} className="btn btn-primary">{pending ? "Salvando..." : "Salvar"}</button>
        </div>
      </form>
    );
  }

  function Field(props: { label: string; name: string; type?: string; defaultValue?: string; required?: boolean; err?: string }) {
    return (
      <div>
        <label htmlFor={props.name} className="label-strong block mb-1">{props.label}</label>
        <input id={props.name} name={props.name} type={props.type ?? "text"} defaultValue={props.defaultValue} required={props.required} className="input" />
        {props.err ? <p className="mt-1 text-[12px] text-[var(--danger)]">{props.err}</p> : null}
      </div>
    );
  }
  ```
- [ ] **Step 2:** Create `src/app/(app)/configuracoes/_components/PasswordForm.tsx`:
  ```tsx
  "use client";

  import { useState, useTransition } from "react";
  import { changePassword } from "@/server/actions/settings/changePassword";

  export function PasswordForm() {
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [topError, setTopError] = useState<string | null>(null);
    const [ok, setOk] = useState(false);
    const [pending, start] = useTransition();

    function onSubmit(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault();
      setErrors({}); setTopError(null); setOk(false);
      const fd = new FormData(e.currentTarget);
      start(async () => {
        const r = await changePassword({
          currentPassword: String(fd.get("currentPassword") ?? ""),
          newPassword: String(fd.get("newPassword") ?? ""),
          confirmPassword: String(fd.get("confirmPassword") ?? ""),
        });
        if (r.ok) {
          setOk(true);
          (e.target as HTMLFormElement).reset();
        } else {
          setErrors(r.fieldErrors ?? {}); setTopError(r.error);
        }
      });
    }

    return (
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Senha atual" name="currentPassword" err={errors.currentPassword?.[0]} />
        <Field label="Nova senha" name="newPassword" err={errors.newPassword?.[0]} />
        <Field label="Confirmar" name="confirmPassword" err={errors.confirmPassword?.[0]} />
        {topError ? <p className="text-[13px] text-[var(--danger-text)]">{topError}</p> : null}
        {ok ? <p className="text-[13px] text-[var(--success-text)]">Senha atualizada.</p> : null}
        <div className="flex justify-end">
          <button type="submit" disabled={pending} className="btn btn-primary">
            {pending ? "Salvando..." : "Trocar senha"}
          </button>
        </div>
      </form>
    );
  }

  function Field(props: { label: string; name: string; err?: string }) {
    return (
      <div>
        <label htmlFor={props.name} className="label-strong block mb-1">{props.label}</label>
        <input id={props.name} name={props.name} type="password" required minLength={8} className="input" />
        {props.err ? <p className="mt-1 text-[12px] text-[var(--danger)]">{props.err}</p> : null}
      </div>
    );
  }
  ```
- [ ] **Step 3:** Create `src/app/(app)/configuracoes/_components/LogoutButton.tsx`:
  ```tsx
  "use client";

  import { useTransition } from "react";
  import { logoutAction } from "@/server/actions/auth/logout";

  export function LogoutButton() {
    const [pending, start] = useTransition();
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => { await logoutAction(); })}
        className="btn btn-secondary"
      >
        {pending ? "Saindo..." : "Sair"}
      </button>
    );
  }
  ```
- [ ] **Step 4:** Create `src/app/(app)/configuracoes/page.tsx`:
  ```tsx
  import { requireUser } from "@/lib/auth-helpers";
  import { Panel } from "@/components/ui/panel";
  import { ProfileForm } from "./_components/ProfileForm";
  import { PasswordForm } from "./_components/PasswordForm";
  import { LogoutButton } from "./_components/LogoutButton";

  export const dynamic = "force-dynamic";

  export default async function ConfiguracoesPage() {
    const user = await requireUser();
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-6 md:px-8 md:py-8">
        <div className="mb-6">
          <p className="label">Conta</p>
          <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-[var(--ink)]">Configurações</h2>
          <p className="mt-1 text-[13px] text-[var(--ink-4)]">{user.email}</p>
        </div>
        <div className="space-y-5">
          <Panel eyebrow="Perfil" title="Dados profissionais">
            <ProfileForm user={user} />
          </Panel>
          <Panel eyebrow="Segurança" title="Trocar senha">
            <PasswordForm />
          </Panel>
          <Panel eyebrow="Sessão" title="Sair do sistema">
            <p className="text-[13px] text-[var(--ink-3)] mb-3">
              Você será redirecionada para a tela de login.
            </p>
            <LogoutButton />
          </Panel>
        </div>
      </div>
    );
  }
  ```
- [ ] **Step 5:** Add a sidebar link for `/configuracoes` in `src/components/features/sidebar.tsx` and `mobile-nav.tsx`. Inside `navItems` add:
  ```ts
  { label: "Configurações", href: "/configuracoes", icon: Settings },
  ```
  And import `Settings` from `lucide-react`.
- [ ] **Step 6:** Run `npm run build` + manual: open `/configuracoes`, edit profile, change password, log out — verify flow.
- [ ] **Step 7:** Commit `feat(settings): /configuracoes page with profile, password, logout`.

---

## Phase 14 — Polish + CI

### Task 14.1: Loading states + Suspense boundaries

**Files:** Create `loading.tsx` for `(app)` routes that fetch from DB.

- [ ] **Step 1:** Create `src/app/(app)/loading.tsx`:
  ```tsx
  import { Skeleton } from "@/components/ui/skeleton";

  export default function Loading() {
    return (
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-3 h-7 w-64" />
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }
  ```
- [ ] **Step 2:** Create the same for `pacientes/`, `agenda/`, `prontuarios/`, `financeiro/`, `configuracoes/` if you want page-specific shapes. Otherwise the route-group `loading.tsx` covers everyone.
- [ ] **Step 3:** Commit `feat(ui): app-level loading state with skeletons`.

---

### Task 14.2: Mobile bottom tab bar

**Files:** Create `src/components/features/bottom-tabs.tsx`. Modify `src/app/(app)/layout.tsx`.

- [ ] **Step 1:** Create `src/components/features/bottom-tabs.tsx`:
  ```tsx
  "use client";

  import Link from "next/link";
  import { usePathname } from "next/navigation";
  import { Activity, CalendarDays, FileText, UsersRound, WalletCards } from "lucide-react";

  const items = [
    { label: "Hoje", href: "/", icon: Activity },
    { label: "Agenda", href: "/agenda", icon: CalendarDays },
    { label: "Pacientes", href: "/pacientes", icon: UsersRound },
    { label: "Prontuários", href: "/prontuarios", icon: FileText },
    { label: "Finanças", href: "/financeiro", icon: WalletCards },
  ];

  export function BottomTabs() {
    const pathname = usePathname();
    return (
      <nav
        aria-label="Navegação principal mobile"
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur lg:hidden"
      >
        {items.map((it) => {
          const isActive = it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={
                "flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10.5px] font-medium " +
                (isActive ? "text-[var(--blue)]" : "text-[var(--ink-4)]")
              }
            >
              <it.icon size={18} strokeWidth={1.8} />
              {it.label}
            </Link>
          );
        })}
      </nav>
    );
  }
  ```
- [ ] **Step 2:** In `src/app/(app)/layout.tsx`, render `<BottomTabs />` at the end of `<div>` and add bottom padding to `<main>` so content isn't covered:
  ```tsx
  import { BottomTabs } from "@/components/features/bottom-tabs";
  // ...
  <main className="flex-1 pb-16 lg:pb-0">{children}</main>
  // ...
  <BottomTabs />
  ```
- [ ] **Step 3:** Manual: shrink browser to mobile width; tabs appear at bottom, sidebar disappears (already `lg:flex` only).
- [ ] **Step 4:** Commit `feat(mobile): bottom tab bar for navigation`.

---

### Task 14.3: Remove old mock data and unused legacy code

**Files:** Delete `src/lib/mock-data.ts`. Remove unused exports in `src/lib/domain.ts`.

- [ ] **Step 1:** Find what still imports from `@/lib/mock-data`:
  ```bash
  grep -rn "from \"@/lib/mock-data\"" src/ || echo "no imports"
  grep -rn "from \"@/lib/domain\"" src/ || echo "no imports"
  ```
  After all migrations, the count should be 0 for `mock-data` and only the Patient/Session enum-ish types should remain in `domain.ts` (replaced by Prisma types).
- [ ] **Step 2:** Delete `src/lib/mock-data.ts`:
  ```bash
  rm src/lib/mock-data.ts
  ```
- [ ] **Step 3:** Either delete `src/lib/domain.ts` entirely or replace its content with a tiny re-export of Prisma types for backwards compatibility:
  ```ts
  export type {
    Patient,
    TherapySession,
    ClinicalRecord,
    Note,
    Consent,
    ClinicalAttachment,
    BillingEntry,
    TimelineItem,
  } from "@prisma/client";
  ```
- [ ] **Step 4:** Run `npm run build`. Fix any leftover import errors.
- [ ] **Step 5:** Commit `chore: remove mock data; domain.ts re-exports prisma types`.

---

### Task 14.4: GitHub Actions CI

**Files:** Create `.github/workflows/ci.yml`.

- [ ] **Step 1:** Create `.github/workflows/ci.yml`:
  ```yaml
  name: CI
  on:
    push:
      branches: [master, main]
    pull_request:

  jobs:
    unit:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with:
            node-version: 24
            cache: npm
        - run: npm ci
        - run: npx prisma generate
        - run: npm run test:unit
        - run: npm run build
          env:
            DATABASE_URL: postgresql://psi:psi@localhost:5432/ci_placeholder
            AUTH_SECRET: ci-build-only-secret
            AUTH_URL: http://localhost:3000

    integration:
      runs-on: ubuntu-latest
      services:
        postgres:
          image: postgres:17-alpine
          env:
            POSTGRES_USER: psi
            POSTGRES_PASSWORD: psi
            POSTGRES_DB: clinica_ia_test
          ports: ["5433:5432"]
          options: >-
            --health-cmd "pg_isready -U psi"
            --health-interval 5s
            --health-timeout 3s
            --health-retries 10
      env:
        DATABASE_URL: postgresql://psi:psi@localhost:5433/clinica_ia_test
        DATABASE_URL_TEST: postgresql://psi:psi@localhost:5433/clinica_ia_test
        AUTH_SECRET: ci-test-secret
        AUTH_URL: http://localhost:3000
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with:
            node-version: 24
            cache: npm
        - run: npm ci
        - run: npx prisma migrate deploy
        - run: npm run test:integration
  ```
- [ ] **Step 2:** Local dry-run:
  ```bash
  npm run db:test:up
  $env:DATABASE_URL_TEST = "postgresql://psi:psi@localhost:5433/clinica_ia_test"
  npx prisma migrate deploy
  npm run test:integration
  ```
  Expected: all integration tests PASS.
- [ ] **Step 3:** Commit `ci: github actions workflow (unit + integration with postgres service)`.

---

### Task 14.5: Final smoke and README update

**Files:** Modify `README.md`.

- [ ] **Step 1:** Replace `README.md` with the new dev-setup focused content:
  ```md
  # Clínica IA

  Painel de gestão para psicólogos autônomos: agenda, pacientes, prontuários DAP/BIRP, financeiro e compliance. Single-tenant, sem agentes IA, sem automação de WhatsApp.

  ## Stack

  Next.js 16, React 19, TypeScript, Tailwind 4, PostgreSQL 17, Prisma, Auth.js v5, Vitest. Geist Sans/Mono.

  ## Pré-requisitos

  - Node.js 24 LTS
  - Docker Desktop (para Postgres local)

  ## Setup

  ```bash
  cp .env.example .env
  # Edite .env: gere AUTH_SECRET com `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
  # Defina INITIAL_USER_PASSWORD com uma senha forte

  npm install
  npm run db:up                # sobe Postgres em :5432
  npm run db:migrate           # aplica schema
  npm run db:seed              # cria sua conta inicial
  npm run dev                  # http://localhost:3000
  ```

  Para testes:
  ```bash
  npm run db:test:up           # Postgres de teste em :5433 (tmpfs)
  npx prisma migrate deploy    # com DATABASE_URL apontando pra :5433
  npm run test                 # unit + integration
  ```

  ## Comandos

  - `npm run dev` — dev server
  - `npm run build` / `npm run start` — produção
  - `npm run lint`
  - `npm run test` · `test:unit` · `test:integration` · `test:coverage`
  - `npm run db:up` / `db:down` / `db:migrate` / `db:seed` / `db:studio`

  ## Documentação

  - Design spec: `docs/superpowers/specs/2026-05-27-rework-clinica-ia-design.md`
  - Plano de implementação: `docs/superpowers/plans/2026-05-27-rework-clinica-ia.md`
  ```
- [ ] **Step 2:** Full smoke from a fresh clone perspective: drop DB and re-run `db:up`, `db:migrate`, `db:seed`, `dev`. Log in, create patient, schedule session, atender, mark paid, change profile, log out, request password reset, redefine.
- [ ] **Step 3:** Commit `docs: README with new setup + commands`.

---

## Self-review (post-plan)

After all phases ship, verify against the spec:

- [ ] **Spec coverage**: cada seção em `docs/superpowers/specs/2026-05-27-rework-clinica-ia-design.md` tem task correspondente:
  - Stack/folder structure → Phase 0
  - Schema + retenção → Phase 1 + Phase 8.1
  - Auth (login/middleware) → Phase 3
  - Recuperação de senha → Phase 12
  - Trocar senha → Phase 13
  - Patient CRUD → Phase 5
  - Session CRUD → Phase 6
  - Atender → Phase 7
  - Records DAP/BIRP → Phase 8.1-8.4
  - Notes → Phase 8.5
  - Ficha do paciente com sessions/records/notes/billing → Phase 8.6
  - Billing → Phase 9
  - Home "Hoje" → Phase 10
  - Compliance → Phase 11
  - Configurações → Phase 13
  - Mobile bottom tabs → Phase 14.2
  - Loading states → Phase 14.1
  - CI → Phase 14.4
- [ ] **Type consistency**: `User`, `Patient`, `TherapySession`, `ClinicalRecord`, `Note`, `BillingEntry` são sempre os tipos gerados pelo Prisma. `ActionResult<T>` tem assinatura única.
- [ ] **Naming**: para cada Server Action, existe `<verb>ForUser(userId, input)` pura (testável) e `<verb>(input)` que adiciona `requireUser` + `revalidatePath`. Padrão respeitado em createPatient, updatePatient, archivePatient, createSession, confirmSession, markAttendance, cancelSession, saveAttendance, createRecord, updateRecord, deleteRecord, createNote, deleteNote, markPaid, updateProfile, changePassword.
- [ ] **No placeholders**: todo step com código completo ou comando concreto. Verificado via grep para "TBD", "TODO", "implement later".
- [ ] **Removed surface**: nenhum import de `agentSettings`, `automationRules`, `messageTemplates`, `notifications` (do mock), `whatsapp_sdr`, `whatsapp_recepcionista`. Verificar com `grep -rn` ao terminar.
- [ ] **Smoke final**: `npm run test` (unit + integration) + `npm run build` + roteiro manual da Task 14.5.

### Explicitamente deferido (fora do escopo da v1)

Itens que apareceram em discussões mas **não fazem parte deste plano** (alinhados com o spec):
- Atalhos de teclado (`?`, `g+a`, `n+p`, etc) — feature de power user, adiamento de UX
- E2E com Playwright
- Multi-tenant (cadastro público, isolamento)
- Lembretes automáticos por email
- Integração com calendário externo
- Emissão automática de NFS-e
- Pagamentos online (Pix dinâmico, gateway)
- Dark mode
- i18n

---

## Execution handoff

Plano completo. Duas formas de executar:

1. **Subagent-Driven (recomendado)** — disparo um subagente novo por Task, com revisão entre elas. Iteração rápida.
2. **Inline Execution** — executo as tasks nesta sessão, agrupando-as em checkpoints para revisão.

Qual você prefere?


