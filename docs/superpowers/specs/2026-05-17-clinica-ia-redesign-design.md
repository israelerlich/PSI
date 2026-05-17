# Clínica IA — Redesign Completo

Data: 2026-05-17
Status: aprovado

## Objetivo

Reformulação completa do design visual e da arquitetura de código do dashboard SaaS para psicólogos. O projeto atual é uma página única de 815 linhas com dados mockados — será transformado em uma aplicação multi-página com componentes reutilizáveis, navegação real, responsividade mobile-first e sistema visual refinado.

## Arquitetura

Abordagem híbrida: layout compartilhado (sidebar + header) com página inicial de dashboard operacional e páginas dedicadas para cada seção.

```
src/
├── app/
│   ├── layout.tsx               ← Layout raiz (metadata, fonte, globals.css)
│   ├── globals.css               ← CSS custom properties, resets, tema
│   ├── (dashboard)/
│   │   ├── layout.tsx            ← Layout compartilhado: sidebar + header + <main>
│   │   ├── _components/          ← Componentes privados do dashboard
│   │   │   ├── sidebar.tsx       ← Navegação lateral desktop
│   │   │   ├── header.tsx        ← Header sticky com data, título, ações
│   │   │   ├── mobile-nav.tsx    ← Drawer mobile com navegação
│   │   │   ├── stat-card.tsx     ← Card de indicador numérico
│   │   │   ├── panel.tsx         ← Container de seção com título e ação
│   │   │   ├── badge.tsx         ← Tag de status colorida (substitui Pill)
│   │   │   ├── empty-state.tsx   ← Estado vazio com ícone e ação
│   │   │   ├── skeleton.tsx      ← Loading skeleton com animação pulse
│   │   │   ├── session-row.tsx   ← Linha de sessão na agenda
│   │   │   ├── patient-card.tsx  ← Card de paciente (grid e detalhe)
│   │   │   ├── record-card.tsx   ← Card de prontuário
│   │   │   ├── queue-item.tsx    ← Item da fila de trabalho
│   │   │   ├── workflow-step.tsx ← Passo do fluxo WhatsApp IA
│   │   │   ├── search-input.tsx  ← Campo de busca com ícone
│   │   │   └── filter-bar.tsx    ← Barra de filtros (período, status)
│   │   ├── page.tsx              ← Dashboard operacional (visão geral)
│   │   ├── agenda/
│   │   │   └── page.tsx          ← Agenda completa com busca e filtros
│   │   ├── pacientes/
│   │   │   ├── page.tsx          ← Grid de pacientes ativos
│   │   │   └── [id]/
│   │   │       └── page.tsx      ← Detalhe do paciente (sessões, prontuários, notas)
│   │   ├── prontuarios/
│   │   │   ├── page.tsx          ← Lista de prontuários
│   │   │   └── [id]/
│   │   │       └── page.tsx      ← Visualização completa do prontuário
│   │   ├── whatsapp/
│   │   │   └── page.tsx          ← Configuração e status do agente WhatsApp
│   │   └── compliance/
│   │       └── page.tsx          ← Checklist de compliance CFP
│   └── api/...                   ← Rotas API existentes
```

## Sistema Visual

### Cores

```css
--background:    #f8f7f4   /* fundo levemente mais quente */
--foreground:    #1c1917
--surface:       #ffffff
--surface-muted: #f0efea
--line:          #e4e1d9
--brand:         #0d9488   /* teal-600, mais vibrante */
--brand-strong:  #0f766e   /* teal-700 */
--brand-subtle:  #f0fdfa   /* teal-50 */
--accent:        #c2410c   /* orange-700 */
--success:       #15803d   /* green-700 */
--warning:       #a16207   /* amber-700 */
--danger:        #b91c1c   /* red-700 */
```

### Tipografia

- Fonte principal: Inter (já existente)
- Escala:
  - Page title: `text-2xl md:text-3xl font-semibold`
  - Panel title: `text-lg font-semibold`
  - Card title: `text-base font-semibold`
  - Body: `text-sm`
  - Labels: `text-xs font-semibold uppercase tracking-[0.14em]`

### Componentes de design

- **Badge** — substitui Pill, com variantes: neutral, success, warning, danger, info
- **EmptyState** — ícone grande + título + descrição + botão de ação opcional
- **Skeleton** — retângulos com `animate-pulse` para loading states
- **SearchInput** — input com ícone de lupa à esquerda, clear button à direita

### Responsividade

- **Mobile (< lg):** Sidebar vira drawer (sheet) acionado por botão hamburger no header. Navegação por lista vertical com ícones.
- **Tablet (lg):** Sidebar completa como hoje (w-72).
- **Desktop (xl+):** Grid de 2 colunas no dashboard (conteúdo principal + aside).

### Micro-interações

- Cards com `hover:shadow-md hover:-translate-y-0.5 transition` sutis
- Badges com animação de entrada
- Sidebar mobile com slide-in da esquerda

## Conteúdo das Páginas

### `/` — Dashboard Operacional (Home)

- 4 StatCards: sessões hoje, pacientes ativos, pendências, prontuários
- Fila de trabalho (QueueItem × 3)
- Preview das próximas 4 sessões
- Card do paciente em foco (próximo da agenda)
- Coluna lateral: WhatsApp status, notificações, slots livres

### `/agenda` — Agenda Completa

- Busca por paciente/status/modalidade
- Filtro de período: Hoje / Semana / Mês
- Tabela de sessões com colunas: Hora, Paciente, Status, Prontuário, Financeiro
- Botão "Nova sessão" (inicialmente só com placeholder)

### `/pacientes` — Pacientes

- Grid de cards (2 colunas no xl, 1 coluna abaixo)
- Busca por nome
- Botão "Adicionar paciente" (placeholder)
- Cada card: nome, WhatsApp, modalidade, status financeiro, pendências

### `/pacientes/[id]` — Detalhe do Paciente

- Dados completos (nome, WhatsApp, email, nascimento, modalidade)
- Alertas e tags
- Timeline de sessões
- Prontuários vinculados
- Anotações

### `/prontuarios` — Prontuários

- Lista de registros clínicos
- Filtro por template (DAP/BIRP)
- Cada card: paciente, template, data da sessão, data de criação, retenção
- Botão exportar (HTML imprimível)

### `/prontuarios/[id]` — Visualização do Prontuário

- Campos preenchidos em grid
- Botão exportar
- Informações de retenção

### `/whatsapp` — WhatsApp IA

- Status do agente (conectado/desconectado)
- Workflow de 3 passos: triagem SDR, remarcação, handoff
- Configurações: persona, abordagem, preço, horários
- Preview de próxima resposta aprovada

### `/compliance` — Compliance CFP

- Checklist de 4 itens com ícones de check
- Status visual de cada regra

## Navegação

Itens da sidebar (presentes em todas as páginas):

| Ícone | Label | Rota |
|-------|-------|------|
| Activity | Hoje | `/` |
| CalendarDays | Agenda | `/agenda` |
| UsersRound | Pacientes | `/pacientes` |
| FileText | Prontuários | `/prontuarios` |
| Bot | WhatsApp IA | `/whatsapp` |
| ShieldCheck | Compliance | `/compliance` |

A sidebar também mostra informações do psicólogo no rodapé (nome, CRP, cidade).

## O que NÃO está no escopo

- Conexão real com Supabase (continua mockado)
- Autenticação
- Formulários funcionais (botões e inputs existem mas são placeholders)
- Drag-and-drop na agenda
- Integração real com WhatsApp BSP
- PDF server-side
- Onboarding guiado
