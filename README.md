# Clínica IA

Painel de gestão para psicólogos autônomos: agenda, pacientes, prontuários DAP/BIRP, financeiro e compliance. **Single-tenant**, sem agentes IA, sem automação de WhatsApp — só guarda o número como contato.

## Stack

Next.js 16, React 19, TypeScript, Tailwind CSS 4, Geist Sans/Mono. PostgreSQL 17 via Prisma 6. Auth.js v5 com Credentials provider. Vitest + Testing Library.

## Pré-requisitos

- Node.js 24 LTS
- Docker Desktop (para PostgreSQL local) — alternativa: instalar Postgres direto ou apontar `DATABASE_URL` pra um banco gerenciado (Neon, Supabase, Railway…)

## Setup

```bash
cp .env.example .env
# Edite .env:
# - Gere AUTH_SECRET:  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# - Defina INITIAL_USER_PASSWORD com uma senha forte
# - (Opcional) RESEND_API_KEY para envio de email; sem ela os links de
#   recuperação de senha são logados no console em dev.

npm install
npm run db:up           # sobe Postgres em :5432
npm run db:migrate:deploy
npm run db:seed         # cria sua conta inicial
npm run dev             # http://localhost:3000
```

Faça login em `http://localhost:3000/login` com `INITIAL_USER_EMAIL` e a senha do seu `.env`.

## Comandos

```bash
npm run dev               # dev server
npm run build && npm start  # produção
npm run lint
npm test                  # unit + integration
npm run test:unit         # unit only (rápido, sem DB)
npm run test:integration  # precisa de Postgres em :5433
npm run test:coverage

npm run db:up / db:down
npm run db:test:up / db:test:down
npm run db:migrate           # cria nova migration (dev)
npm run db:migrate:deploy    # aplica migrations existentes
npm run db:seed
npm run db:studio            # GUI Prisma
```

### Testes de integração

Precisam de um Postgres separado em `:5433` para isolar os dados:

```bash
npm run db:test:up
$env:DATABASE_URL_TEST = "postgresql://psi:psi@localhost:5433/clinica_ia_test"
$env:DATABASE_URL = $env:DATABASE_URL_TEST
npx prisma migrate deploy
npm run test:integration
```

## Arquitetura

- `src/app/(auth)/` — rotas públicas (login, esqueci-senha, redefinir-senha)
- `src/app/(app)/` — rotas protegidas pelo middleware
- `src/lib/` — Prisma client, Auth.js, validators Zod, helpers
- `src/server/actions/` — Server Actions (mutações)
- `src/server/queries/` — funções de leitura tipadas
- `src/middleware.ts` — auth gate
- `prisma/schema.prisma` + `prisma/migrations/`
- `tests/unit/` + `tests/integration/` + `tests/components/`

## Funcionalidades

- **Hoje (/)**: KPIs do dia, sessões agendadas, pendências
- **Agenda**: lista por período, criar sessão (com detecção de conflito), confirmar, marcar presença, cancelar
- **Atender (/agenda/[id])**: tela única para presença + prontuário DAP/BIRP + anotação + pagamento, salva tudo em uma transação
- **Pacientes**: lista com busca, criar via drawer, ficha com seções (sessões, prontuários, anotações, financeiro), abrir WhatsApp Web
- **Prontuários**: lista com busca, editor inline, retenção obrigatória de 5 anos
- **Financeiro**: KPIs, lista de cobranças, marcar como paga
- **Configurações**: perfil (nome, CRP, cidade, telefone, valor padrão de sessão), trocar senha, logout
- **Compliance**: regras vigentes do CFP aplicadas no sistema
- **Auth**: email + senha (bcrypt 12 rounds), sessão em DB (Auth.js), recuperação por email (Resend)

## Documentação

- Spec: `docs/superpowers/specs/2026-05-27-rework-clinica-ia-design.md`
- Plano de implementação: `docs/superpowers/plans/2026-05-27-rework-clinica-ia.md`

## Fora do escopo da v1

E2E com Playwright, multi-tenant, lembretes automáticos por email, integração com calendário externo, emissão automática de NFS-e, pagamentos online, dark mode, i18n.
