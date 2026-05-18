# Clínica IA

Projeto inicial baseado no documento **Sistema para Psicólogos - Regras de Negócio**.

## Análise do documento

A solução é uma plataforma SaaS single-user para psicólogos autônomos. O dashboard web concentra dados clínicos e administrativos, enquanto o WhatsApp atua apenas como SDR/recepcionista para captação, remarcação, cancelamento, lembretes e handoff.

Regras centrais aplicadas nesta base:

- Prontuários DAP/BIRP são manuais, autorais e acessíveis somente pelo dashboard.
- Dados clínicos não trafegam pelo WhatsApp.
- Pacientes podem ser criados manualmente ou por lead qualificado pelo SDR.
- Sessões possuem status clínico-operacional e pagamento apenas visual.
- Prontuários e notas vinculadas a sessões seguem retenção mínima de 5 anos.
- O agente alterna entre SDR e recepcionista conforme o telefone já exista na base.

## O que foi criado

- App Next.js 16 com TypeScript, Tailwind CSS e App Router.
- Dashboard inicial com agenda, pacientes, prontuários, notificações, configurações do agente e compliance.
- Dados mockados tipados em `src/lib/mock-data.ts`.
- Rotas API iniciais:
  - `GET /api/agenda/slots`
  - `POST /api/whatsapp/webhook`
  - `GET /api/records/export/[id]`
- Schema Supabase inicial em `supabase/schema.sql`, com RLS e travas de retenção.
- `.env.example` com variáveis previstas para Supabase, OpenAI e BSP de WhatsApp.

## Rodando localmente

```bash
npm run dev
```

Acesse `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run build
npm run lint
```

## Próximos passos

1. Criar autenticação Supabase no dashboard.
2. Trocar dados mockados por queries reais com RLS.
3. Implementar fila de background para WhatsApp, lembretes e fila de espera.
4. Conectar OpenAI e BSP de WhatsApp com logs administrativos.
5. Evoluir exportação HTML para PDF server-side.
