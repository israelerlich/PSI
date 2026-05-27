# Rework Clínica IA — Design Spec

**Data**: 2026-05-27
**Status**: aprovado em brainstorming, aguardando revisão escrita

## Sumário

Refazer o projeto Clínica IA focado em **experiência do usuário** e **praticidade diária** para uma psicóloga autônoma. Trocar dados mockados por banco real (PostgreSQL), adicionar sistema de login (email + senha) com recuperação de senha, e remover tudo relacionado a Agente IA / WhatsApp / automações / alertas.

## Stack confirmada

| Camada | Escolha | Motivo |
|---|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TS | Já existe, App Router permite Server Actions |
| Estilo | Tailwind CSS 4 + Geist Sans/Mono | Mantém o painel branco/azul atual |
| Banco | **PostgreSQL 17** (Docker) | Enums nativos, JSONB para fields de prontuário |
| ORM | **Prisma** | Schema declarativo, migrations versionadas, types gerados |
| Auth | **Auth.js v5** (Credentials + Prisma adapter, session DB) | Padrão da comunidade, fácil revogação |
| Hash | **bcryptjs** (12 rounds) | JS puro, sem build nativo |
| Email | **Resend** + fallback console.log em dev | Free tier 100/dia, API simples |
| Validação | **Zod** | Em toda Server Action |
| Mutações | **Next Server Actions** | Sem boilerplate de API route |
| Testes | **Vitest** + Testing Library + Postgres de teste | Rápido, ESM, compatível com Next 16 |
| CI | GitHub Actions | unit (sem DB) + integration (com Postgres) em jobs paralelos |
| Deploy alvo | Vercel + Postgres gerenciado (Neon, Railway, Render) | Decisão para fora do escopo da v1 |

## Modelo de conta

**Single-tenant**: uma psicóloga = uma instância. A primeira conta é criada pela seed (`prisma/seed.ts`) usando `INITIAL_USER_EMAIL` / `INITIAL_USER_PASSWORD` do `.env`. Sem cadastro público. Todas as entidades de domínio têm `userId` apontando para a única dona — preparado para evolução multi-tenant sem migração de dados.

## Estrutura de pastas

```
src/
├── app/
│   ├── (auth)/                    rotas públicas
│   │   ├── login/page.tsx
│   │   ├── esqueci-senha/page.tsx
│   │   ├── redefinir-senha/page.tsx
│   │   └── layout.tsx              (centralizado, sem sidebar)
│   ├── (app)/                      rotas protegidas
│   │   ├── layout.tsx              (sidebar + header)
│   │   ├── page.tsx                (Hoje)
│   │   ├── agenda/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx       (tela Atender)
│   │   ├── pacientes/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── prontuarios/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── financeiro/page.tsx
│   │   ├── compliance/page.tsx
│   │   └── configuracoes/page.tsx
│   ├── api/auth/[...nextauth]/route.ts
│   └── layout.tsx                  (root, fontes + globals.css)
├── lib/
│   ├── db.ts                       (Prisma client singleton)
│   ├── auth.ts                     (Auth.js config + getServerSession)
│   ├── auth-helpers.ts             (requireUser, requireSession)
│   ├── email.ts                    (Resend wrapper + console fallback)
│   ├── validators/                 (schemas Zod por entidade)
│   └── format/                     (date, currency, phone)
├── server/
│   ├── actions/
│   │   ├── auth/                   (login, logout, request-reset, reset-password, change-password)
│   │   ├── patient/                (create, update, archive)
│   │   ├── session/                (create, confirm, mark-attendance, cancel)
│   │   ├── record/                 (create, update, export)
│   │   ├── note/                   (create, delete)
│   │   └── billing/                (mark-paid, generate-receipt)
│   └── queries/                    (funções de leitura tipadas)
├── components/
│   ├── ui/                         (Button, Input, Dialog, Drawer, Card, Badge, Skeleton, Tabs)
│   └── features/                   (PatientForm, PatientCard, SessionRow, SessionForm, RecordEditor, BillingRow)
└── middleware.ts                   (auth gate)

prisma/
├── schema.prisma
├── seed.ts
└── migrations/

tests/
├── unit/                           (validators, format, password)
├── integration/                    (Server Actions com Postgres real)
├── components/                     (componentes de domínio)
└── helpers/
    └── db.ts                       (withCleanDb, seed helpers)

docker-compose.yml                  (Postgres dev)
docker-compose.test.yml             (Postgres test)
.github/workflows/ci.yml
.env.example
```

## Schema (Prisma)

### Domínio

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String
  crp          String
  city         String?
  phone        String?
  defaultSessionPriceCents Int @default(20000)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Auth.js
  authSessions AuthSession[]
  passwordResetTokens PasswordResetToken[]

  // Domain
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
  id             String   @id @default(cuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name           String
  email          String?
  whatsapp       String?
  birthDate      DateTime?
  modality       Modality @default(online)
  archived       Boolean  @default(false)
  generalNotes   String?
  consentStatus  ConsentStatus @default(pending)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

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
  id                  String  @id @default(cuid())
  userId              String
  patientId           String
  patient             Patient @relation(fields: [patientId], references: [id], onDelete: Cascade)
  user                User    @relation(fields: [userId], references: [id], onDelete: Cascade)
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
  id             String         @id @default(cuid())
  userId         String
  patientId      String
  sessionId      String?        @unique
  patient        Patient        @relation(fields: [patientId], references: [id], onDelete: Cascade)
  user           User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  session        TherapySession? @relation(fields: [sessionId], references: [id])
  template       RecordTemplate
  fields         Json           // [{label, value}, ...]
  contextSummary String?
  retentionUntil DateTime       // hoje + 5 anos no momento da criação
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

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
  id        String        @id @default(cuid())
  userId    String
  patientId String
  patient   Patient       @relation(fields: [patientId], references: [id], onDelete: Cascade)
  user      User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String
  status    ConsentSignStatus @default(pending)
  signedAt  DateTime?
  fileUrl   String?
  createdAt DateTime      @default(now())

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
  kind      String   // "session", "note", "consent", "manual"
  createdAt DateTime @default(now())

  @@index([userId, patientId])
}

enum Modality          { online presencial }
enum SessionStatus     { AGENDADA REMANEJADA CANCELADA CONCLUIDA NAO_COMPARECEU }
enum PaymentStatus     { PENDENTE PAGO }
enum ConfirmationStatus { pending confirmed rescheduled manual_review }
enum AttendanceStatus  { expected present missed excused }
enum DocumentationStatus { not_started draft complete }
enum SessionOrigin     { dashboard imported }
enum RecordTemplate    { DAP BIRP }
enum ConsentStatus     { pending complete expired }
enum ConsentSignStatus { pending signed expired }
enum InvoiceStatus     { not_required ready issued failed }
enum ReceiptStatus     { not_ready ready sent }
```

### Auth.js + recuperação de senha

```prisma
model AuthSession {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model PasswordResetToken {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique          // hash do token enviado por email
  expiresAt DateTime                   // criação + 1h
  usedAt    DateTime?
  createdAt DateTime @default(now())

  @@index([userId])
}
```

### Constraints adicionais
- `ClinicalRecord` não pode ser deletado se `retentionUntil > now()` — validação na **Server Action** `deleteRecord` (decisão: regra de negócio na aplicação, não no banco, para facilitar testabilidade e mensagens de erro).
- `endsAt > startsAt` em `TherapySession` (CHECK constraint no Postgres).
- `email` único em `User` (unique constraint).
- Sobreposição de horário em `TherapySession`: validado na Server Action `createSession` via query (`SELECT ... WHERE userId AND tstzrange OVERLAPS`).

## Fluxo de autenticação

### Login (single tenant, email + senha)

```
1. middleware.ts roda em todas rotas
2. Para rotas em (app)/, verifica cookie auth-session via getServerSession()
   - Sem sessão válida → 302 /login?next=<caminho>
3. /login: form (email, senha, "Esqueci minha senha")
   - Server Action loginAction({ email, password }):
     - Zod valida formato de email + senha não-vazia
     - Busca user; se não existe, retorna mensagem genérica "Credenciais inválidas" (evita user-enumeration)
     - bcrypt.compare; falha = mesma mensagem genérica
     - Cria AuthSession (token aleatório de 32 bytes, expira em 30 dias)
     - Seta cookie HttpOnly, Secure (prod), SameSite=Lax
     - redirect(next ?? "/")
4. Header "Sair" chama logoutAction: deleta AuthSession + limpa cookie + redirect /login
```

### Recuperação de senha

```
1. /login → link "Esqueci minha senha" → /esqueci-senha
2. Form com email. Server Action requestPasswordReset({ email }):
   - Sempre responde sucesso (evita user-enumeration)
   - Se user existe, gera token 32-byte; salva hash em PasswordResetToken; expira em 1h
   - Envia email com link /redefinir-senha?token=<token-em-claro>
   - Em dev sem RESEND_API_KEY: console.log(link)
3. /redefinir-senha?token=<x>:
   - Server Action resetPassword({ token, newPassword }):
     - Busca PasswordResetToken pelo hash do token
     - Valida expiresAt > now() e usedAt = null
     - Atualiza User.passwordHash; marca token usedAt = now()
     - Invalida todas as AuthSession do user (segurança)
     - redirect /login?reset=ok
```

### Trocar senha logada

`/configuracoes` → form com senha atual + nova. Server Action `changePassword({ currentPassword, newPassword })`:
- Verifica senha atual com bcrypt.compare
- Hash da nova, atualiza
- Mantém sessão atual ativa, invalida as demais (opcional, configurável)

### Helpers de autorização

```ts
// src/lib/auth-helpers.ts
export async function requireUser(): Promise<User> {
  const session = await getServerSession();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user;
}

// Em toda Server Action:
"use server";
export async function createPatient(input: unknown) {
  const user = await requireUser();
  const data = patientSchema.parse(input);
  return prisma.patient.create({ data: { ...data, userId: user.id } });
}
```

## UX e fluxos do dia a dia

### Página "Hoje" (`/`)

Página inicial otimizada para responder "o que preciso fazer agora?":

- **4 KPIs**: Sessões hoje · Prontuários pendentes · Recebíveis pendentes · Taxa de presença
- **Agenda do dia**: tabela com sessões de hoje, ações inline (Confirmar, Atender, ⋯ menu)
- **Pendências contextuais**: lista curta de coisas a fazer (substitui o painel de "Notificações" antigo, mas é derivada de queries reais — não tabela separada)
- **Quick actions**: + Nova sessão, + Novo paciente (drawer lateral, sem nova rota)

### Tela "Atender" (`/agenda/[id]`)

Tela única para o momento da sessão:
- Dados do paciente (resumo compacto)
- **Marcar presença** (1 clique: presente / falta / justificada)
- **Bloco de prontuário inline**: form DAP ou BIRP direto na tela
- **Anotação rápida**: textarea livre → cria `Note` ao salvar
- **Status financeiro**: marcar como pago / gerar recibo
- "Salvar tudo" via uma única Server Action transacional

### Pacientes (`/pacientes`)

- Lista com busca debounced (300ms)
- Card por paciente: iniciais, nome, próxima sessão, badge de pendência
- "+ Adicionar paciente" abre **drawer lateral** (campos mínimos: nome obrigatório, resto opcional)
- Click no card → ficha completa

### Ficha do paciente (`/pacientes/[id]`)

- Header com nome, contato, **botão "Abrir WhatsApp"** (`wa.me/55<numero>`)
- Tabs: Sessões · Prontuários · Anotações · Financeiro · Documentos
- Cada tab é um Server Component com `<Suspense>` boundary — só carrega ao ativar (via segmento da URL ou client-side state com `loading.tsx`); evita renderizar todos os dados de uma vez no servidor
- "+ Nova sessão" sempre visível

### Agenda (`/agenda`)

- Filtros: Hoje · Semana · Mês · Período custom (date range)
- Visualização: lista (default) ou calendário simples
- Click em sessão → `/agenda/[id]` (Atender)

### Prontuários (`/prontuarios`)

- Lista paginada, search por paciente/template
- Click → `/prontuarios/[id]` (visualizar + editar + exportar PDF)

### Financeiro (`/financeiro`)

- KPIs: Recebido (mês) · Pendente · Previsto · Recibos enviados
- Tabela de cobranças com ação inline "Marcar como pago"
- "Gerar recibo PDF" por cobrança paga
- (Sem fila de NFS-e automática — emissão manual no portal da prefeitura, sistema só registra)

### Configurações (`/configuracoes`)

- **Perfil**: nome, CRP, cidade, telefone
- **Conta**: trocar email, trocar senha
- **Faturamento**: valor padrão de sessão, modalidades aceitas

### Atalhos de teclado

- `?` lista atalhos
- `g a` agenda, `g p` pacientes, `g h` hoje, `g f` financeiro
- `n p` novo paciente (drawer), `n s` nova sessão (drawer)
- `/` foca busca global

### Mobile (priorizado)

- Sidebar desktop → bottom tab bar mobile (4 itens principais + "Mais")
- Drawers viram fullscreen sheets
- Tabela de sessões → cards verticais; ações primárias em botões grandes (44px+)
- Tipografia mínima 14px, contraste WCAG AA garantido

## Server Actions e queries

### Convenções

- Toda Server Action começa com `"use server"`
- Toda Server Action segue: `requireUser()` → `schema.parse(input)` → operação no Prisma → `revalidatePath()` se necessário
- Server Actions retornam `{ ok: true, data }` ou `{ ok: false, error: string, fieldErrors?: Record<string, string> }` — typedActionResult
- Queries em `server/queries/` recebem `userId` explicitamente, nunca buscam sessão

### Exemplo: criar paciente

```ts
// src/lib/validators/patient.ts
export const patientSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().optional().or(z.literal("")),
  whatsapp: z.string().regex(/^\+?\d{10,15}$/).optional().or(z.literal("")),
  birthDate: z.coerce.date().optional(),
  modality: z.enum(["online", "presencial"]),
  generalNotes: z.string().max(2000).optional(),
});

// src/server/actions/patient/create.ts
"use server";
export async function createPatient(input: unknown): Promise<ActionResult<Patient>> {
  const user = await requireUser();
  const parsed = patientSchema.safeParse(input);
  if (!parsed.success) return formError(parsed.error);

  const patient = await prisma.patient.create({
    data: { ...parsed.data, userId: user.id },
  });
  revalidatePath("/pacientes");
  return { ok: true, data: patient };
}
```

## Estratégia de testes

### 3 camadas

**Unitários** (`tests/unit/`):
- Schemas Zod (válidos/inválidos por entidade)
- Helpers de format (date, currency, phone BR)
- Helpers de auth (hash, compare)
- Funções puras de regra de negócio

**Integração** (`tests/integration/`):
- Cada Server Action contra Postgres real (`docker-compose.test.yml`)
- Cobre: caminho feliz, validação, autorização (sem user, usuário errado), constraints
- Banco resetado entre testes via truncate cascade ou transaction rollback

**Componentes** (`tests/components/`):
- Forms críticos: PatientForm, SessionForm, RecordEditor, LoginForm
- SessionRow (ações inline disparam props)
- Não testa visual; só comportamento

### Setup

```yaml
# docker-compose.test.yml
services:
  postgres-test:
    image: postgres:17
    environment:
      POSTGRES_USER: psi
      POSTGRES_PASSWORD: psi
      POSTGRES_DB: clinica_ia_test
    ports: ["5433:5432"]
    tmpfs: /var/lib/postgresql/data   # acelera testes
```

```ts
// tests/helpers/db.ts
export const testPrisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL_TEST } },
});

beforeEach(async () => {
  // truncate todas as tabelas exceto _prisma_migrations
  await testPrisma.$executeRawUnsafe(`
    TRUNCATE TABLE "Patient", "TherapySession", "ClinicalRecord",
      "Note", "Consent", "ClinicalAttachment", "BillingEntry",
      "TimelineItem", "User", "AuthSession", "PasswordResetToken"
    RESTART IDENTITY CASCADE
  `);
});
```

### CI (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24 }
      - run: npm ci
      - run: npm run test:unit
      - run: npm run build

  integration:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:17
        env: { POSTGRES_USER: psi, POSTGRES_PASSWORD: psi, POSTGRES_DB: clinica_ia_test }
        ports: ["5433:5432"]
        options: --health-cmd="pg_isready -U psi"
    env:
      DATABASE_URL_TEST: postgresql://psi:psi@localhost:5433/clinica_ia_test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24 }
      - run: npm ci
      - run: npx prisma migrate deploy --schema prisma/schema.prisma
        env: { DATABASE_URL: ${{ env.DATABASE_URL_TEST }} }
      - run: npm run test:integration
```

### Alvo de cobertura

- Server Actions: ≥80%
- Validators: 100%
- Componentes de form: comportamento crítico coberto (sem alvo numérico)

## Plano de migração

### Remover

- `src/app/(dashboard)/whatsapp/` (página inteira)
- `src/app/api/whatsapp/webhook/` (route)
- Painéis "Automação" e "Notificações" do dashboard home
- Componentes `workflow-step.tsx` e `queue-item.tsx` (vinculados ao IA)
- Mock data: `agentSettings`, `automationRules`, `messageTemplates`, `notifications`
- Tipos: `AutomationRule`, `MessageTemplate`, `Notification`, `AgentSettings` em `lib/domain.ts`
- Enum values: `whatsapp_sdr` e `whatsapp_recepcionista` em `SessionOrigin`
- Field `session.reminderStatus` (sem lembretes automáticos)
- Dependência `@supabase/supabase-js`

### Mover/renomear

- `src/app/(dashboard)/` → `src/app/(app)/`
- `_components/` → `src/components/` separado em `ui/` e `features/`

### Adicionar

- `docker-compose.yml` + `docker-compose.test.yml`
- `prisma/schema.prisma` + `prisma/seed.ts` + pasta `migrations/`
- Rotas (auth): `/login`, `/esqueci-senha`, `/redefinir-senha`
- Rota `/configuracoes`
- Rota `/agenda/[id]` (Atender)
- `src/middleware.ts`
- `src/lib/db.ts`, `src/lib/auth.ts`, `src/lib/auth-helpers.ts`, `src/lib/email.ts`
- `src/lib/validators/` (Zod schemas por entidade)
- `src/server/actions/`, `src/server/queries/`
- `tests/` + `vitest.config.ts`
- `.github/workflows/ci.yml`

### Manter (com pequenos ajustes)

- Design system atual (paleta branco/azul, Geist Sans/Mono) — está bom
- Componentes: `Badge`, `StatCard`, `Panel`, `PatientCard`, `RecordCard`, `EmptyState`, `Skeleton`, `SearchInput`, `FilterBar`
- Páginas: Agenda, Pacientes, Prontuários, Financeiro, Compliance — reaproveita layouts; troca mock por queries Prisma; remove painéis IA

### Variáveis de ambiente

```env
# .env.example
DATABASE_URL="postgresql://psi:psi@localhost:5432/clinica_ia"
DATABASE_URL_TEST="postgresql://psi:psi@localhost:5433/clinica_ia_test"
AUTH_SECRET=""                           # openssl rand -base64 32
AUTH_URL="http://localhost:3000"
RESEND_API_KEY=""                        # opcional em dev
EMAIL_FROM="Clínica IA <nao-responda@clinicaia.local>"
INITIAL_USER_EMAIL="marina@clinicaia.local"
INITIAL_USER_PASSWORD=""                 # usado só na primeira seed
```

### Ordem de implementação (alto nível — detalhado vai pro plano)

1. Setup: Docker, Prisma, schema, primeira migração, seed
2. Auth: Login + middleware + helpers (sem recuperação ainda)
3. Server Actions + queries por entidade (com testes integração)
4. Migrar páginas mock → dados reais, uma rota por vez
5. Tela "Atender" nova
6. Recuperação de senha + trocar senha
7. Configurações + perfil
8. CI no GitHub Actions
9. Polimento de UX mobile + atalhos

## Erros e edge cases

- **Constraint violations** (email único, sessão sobreposta): Server Action retorna `fieldErrors` mapeados; UI mostra inline.
- **Sessão expirada durante uso**: Server Action lança redirect para `/login?next=<atual>&reason=expired`.
- **Conflito de horário** (criar sessão em horário ocupado): valida na Server Action via query, retorna `error: "Horário já ocupado"`.
- **Retenção de prontuário**: `deleteRecord` retorna erro se `retentionUntil > now()`.
- **Token reset expirado**: tela informa, oferece link "Pedir novo".
- **Email inválido em forgot password**: sempre responde sucesso (evita user enumeration).
- **Falha do Resend**: log do erro, mas Server Action retorna sucesso (token salvo, próxima tentativa pode ser feita).

## Acessibilidade

- Inputs com labels visíveis
- Erros associados via `aria-describedby`
- Botões com `aria-label` quando só ícone
- Foco visível (`:focus-visible` com ring azul)
- Contraste ≥ WCAG AA em todo texto
- `Esc` fecha drawer/dialog
- Tab order lógico

## Fora do escopo da v1

- E2E com Playwright (decidido)
- Cadastro público / convite por email
- Multi-tenant
- Notificações push / email automatizado de lembretes
- Integração com calendário externo (Google Calendar)
- Emissão automática de NFS-e
- Pagamentos online (Pix dinâmico, gateway)
- App mobile nativo
- Dark mode
- i18n (só pt-BR por enquanto)
