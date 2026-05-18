# Clínica IA Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the monolithic 815-line dashboard into a multi-page Next.js app with extracted components, refined visual design, responsive mobile navigation, and loading/empty states.

**Architecture:** Layout compartilhado `(dashboard)/layout.tsx` com Sidebar fixa + Header sticky + MobileNav drawer. Cada seção vira rota própria no App Router. Componentes UI extraídos para `_components/`. Dados continuam mockados.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide React

---

### Task 1: Refinar sistema visual (globals.css)

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Atualizar cores, tipografia e adicionar variáveis novas**

```css
@import "tailwindcss";

:root {
  --background: #f8f7f4;
  --foreground: #1c1917;
  --surface: #ffffff;
  --surface-muted: #f0efea;
  --line: #e4e1d9;
  --brand: #0d9488;
  --brand-strong: #0f766e;
  --brand-subtle: #f0fdfa;
  --accent: #c2410c;
  --success: #15803d;
  --warning: #a16207;
  --danger: #b91c1c;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: "Inter", "Segoe UI", Arial, Helvetica, sans-serif;
  --font-mono: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  --animate-slide-in-left: slide-in-left 0.2s ease-out;
  @keyframes slide-in-left {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
  }
  --animate-fade-in: fade-in 0.15s ease-out;
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans);
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}

button, input, select, textarea {
  font: inherit;
}

::selection {
  background: rgba(13, 148, 136, 0.2);
}

:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "style: refine color system and add animation tokens"
```

---

### Task 2: Extrair Badge component

**Files:**
- Create: `src/app/(dashboard)/_components/badge.tsx`

- [ ] **Step 1: Criar componente Badge com variantes**

Replace the inline `Pill` component from `page.tsx`:

```tsx
import clsx from "clsx";

type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "info" | "brand";

const variantStyles: Record<BadgeVariant, string> = {
  neutral: "border-stone-200 bg-stone-100 text-stone-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-rose-200 bg-rose-50 text-rose-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
  brand: "border-teal-200 bg-teal-50 text-teal-800",
};

export function Badge({
  children,
  className,
  variant = "neutral",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: BadgeVariant;
}) {
  return (
    <span
      className={clsx(
        "inline-flex w-fit items-center rounded-md border px-2.5 py-1 text-xs font-bold uppercase tracking-[0.08em]",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(dashboard)/_components/badge.tsx
git commit -m "feat: add Badge component with variants"
```

---

### Task 3: Extrair StatCard component

**Files:**
- Create: `src/app/(dashboard)/_components/stat-card.tsx`

- [ ] **Step 1: Extrair StatCard**

Copy the existing `StatCard` function from `page.tsx` into its own file, unchanged except for the import:

```tsx
import type { LucideIcon } from "lucide-react";

export function StatCard({
  detail,
  icon: Icon,
  label,
  value,
}: {
  detail: string;
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-lg border border-[var(--line)] bg-white p-4 shadow-sm transition hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-stone-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-stone-950">{value}</p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-md bg-[var(--surface-muted)] text-[var(--brand)]">
          <Icon aria-hidden="true" size={20} strokeWidth={1.9} />
        </div>
      </div>
      <p className="mt-3 text-sm text-stone-500">{detail}</p>
    </article>
  );
}
```

- [ ] **Step 2: Commit**

---

### Task 4: Extrair Panel component

**Files:**
- Create: `src/app/(dashboard)/_components/panel.tsx`

- [ ] **Step 1: Extrair Panel**

Same pattern — extract the function into its own file.

- [ ] **Step 2: Commit**

---

### Task 5: Extrair SearchInput, QueueItem, SessionRow, PatientCard, RecordCard, WorkflowStep, EmptyState, Skeleton, FilterBar

**Files:**
- Create: `src/app/(dashboard)/_components/search-input.tsx`
- Create: `src/app/(dashboard)/_components/queue-item.tsx`
- Create: `src/app/(dashboard)/_components/session-row.tsx`
- Create: `src/app/(dashboard)/_components/patient-card.tsx`
- Create: `src/app/(dashboard)/_components/record-card.tsx`
- Create: `src/app/(dashboard)/_components/workflow-step.tsx`
- Create: `src/app/(dashboard)/_components/empty-state.tsx`
- Create: `src/app/(dashboard)/_components/skeleton.tsx`
- Create: `src/app/(dashboard)/_components/filter-bar.tsx`
- Create: `src/app/(dashboard)/_components/compliance-item.tsx`

- [ ] **Step 1: Extrair todos os componentes restantes**

Each gets its own file following the same extraction pattern.

**SearchInput:**
```tsx
import { Search, X } from "lucide-react";

export function SearchInput({
  placeholder = "Buscar...",
  value,
  onChange,
}: {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="relative block">
      <span className="sr-only">{placeholder}</span>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
        size={18}
      />
      <input
        className="h-11 w-full rounded-md border border-[var(--line)] bg-white pl-10 pr-8 text-sm outline-none transition placeholder:text-stone-400 focus:border-[var(--brand)] focus:ring-2 focus:ring-teal-100"
        autoComplete="off"
        placeholder={placeholder}
        type="search"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      />
      {value ? (
        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-stone-400 hover:text-stone-600"
          onClick={() => onChange?.("")}
          type="button"
          aria-label="Limpar busca"
        >
          <X size={16} />
        </button>
      ) : null}
    </label>
  );
}
```

**EmptyState:**
```tsx
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[var(--line)] bg-white px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-[var(--surface-muted)] text-stone-400">
        <Icon aria-hidden="true" size={24} strokeWidth={1.5} />
      </div>
      <h3 className="mt-4 text-base font-semibold text-stone-700">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-stone-500">{description}</p>
      {action ? (
        <button
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-md border border-[var(--brand)] bg-[var(--brand)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
          onClick={action.onClick}
          type="button"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
}
```

**Skeleton:**
```tsx
import clsx from "clsx";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "animate-pulse rounded-md bg-stone-200",
        className,
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-white p-5 space-y-4">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

---

### Task 6: Criar Sidebar

**Files:**
- Create: `src/app/(dashboard)/_components/sidebar.tsx`

- [ ] **Step 1: Criar Sidebar com navegação e perfil**

Extracted from the `<aside>` in `page.tsx`, with `usePathname()` for active state:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  Activity,
  Bot,
  CalendarDays,
  FileText,
  HeartHandshake,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { psychologistProfile } from "@/lib/mock-data";

const navItems = [
  { label: "Hoje", href: "/", icon: Activity },
  { label: "Agenda", href: "/agenda", icon: CalendarDays },
  { label: "Pacientes", href: "/pacientes", icon: UsersRound },
  { label: "Prontuários", href: "/prontuarios", icon: FileText },
  { label: "WhatsApp IA", href: "/whatsapp", icon: Bot },
  { label: "Compliance", href: "/compliance", icon: ShieldCheck },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-[var(--line)] bg-white/90 px-5 py-6 lg:flex lg:flex-col">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-md bg-[var(--brand)] text-white">
          <HeartHandshake aria-hidden="true" size={23} strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-base font-semibold text-stone-950">Clínica IA</p>
          <p className="text-xs text-stone-500">Profissional liberal</p>
        </div>
      </div>

      <nav aria-label="Navegação principal" className="space-y-1 flex-1">
        {navItems.map((item) => {
          const isActive = item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
          return (
            <Link
              className={clsx(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]",
                isActive
                  ? "bg-[var(--brand-subtle)] text-[var(--brand-strong)]"
                  : "text-stone-600 hover:bg-[var(--surface-muted)] hover:text-[var(--brand-strong)]",
              )}
              href={item.href}
              key={item.href}
            >
              <item.icon aria-hidden="true" size={18} strokeWidth={1.9} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--line)] pt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
          Conta
        </p>
        <div className="mt-3 space-y-1 text-sm">
          <p className="font-semibold text-stone-900">{psychologistProfile.name}</p>
          <p className="text-stone-500">{psychologistProfile.crp}</p>
          <p className="text-stone-500">{psychologistProfile.city}</p>
        </div>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Commit**

---

### Task 7: Criar Header e MobileNav

**Files:**
- Create: `src/app/(dashboard)/_components/header.tsx`
- Create: `src/app/(dashboard)/_components/mobile-nav.tsx`

- [ ] **Step 1: Criar Header com botão hamburger mobile**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, PhoneCall, Search } from "lucide-react";
import { notifications } from "@/lib/mock-data";
import clsx from "clsx";

export function Header({
  onMenuClick,
}: {
  onMenuClick: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--background)]/94 px-4 py-3 backdrop-blur md:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            className="inline-flex size-10 items-center justify-center rounded-md border border-[var(--line)] bg-white text-stone-600 transition hover:bg-[var(--surface-muted)] lg:hidden"
            onClick={onMenuClick}
            type="button"
            aria-label="Abrir menu"
          >
            <Menu size={20} strokeWidth={2} />
          </button>
          <div>
            <p className="text-sm font-medium text-[var(--brand)]">
              Hoje, 16/05/2026
            </p>
            <h1 className="text-xl font-semibold text-stone-950 md:text-2xl">
              Clínica em operação
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="hidden h-10 items-center gap-2 rounded-md border border-[var(--line)] bg-white px-3 text-sm font-semibold text-stone-600 transition hover:bg-[var(--surface-muted)] sm:inline-flex"
            type="button"
          >
            <Search aria-hidden="true" size={17} strokeWidth={2} />
            Buscar paciente
          </button>
          <button
            className="hidden h-10 items-center gap-2 rounded-md border border-[var(--line)] bg-white px-3 text-sm font-semibold text-stone-600 transition hover:bg-[var(--surface-muted)] sm:inline-flex"
            type="button"
          >
            <PhoneCall aria-hidden="true" size={17} strokeWidth={2} />
            WhatsApp
          </button>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--brand)] bg-[var(--brand)] px-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
            type="button"
          >
            <Bell aria-hidden="true" size={17} strokeWidth={2} />
            <span className="hidden sm:inline">{notifications.length} notificações</span>
          </button>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Criar MobileNav (drawer)**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { X } from "lucide-react";
import {
  Activity,
  Bot,
  CalendarDays,
  FileText,
  HeartHandshake,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { psychologistProfile } from "@/lib/mock-data";

const navItems = [
  { label: "Hoje", href: "/", icon: Activity },
  { label: "Agenda", href: "/agenda", icon: CalendarDays },
  { label: "Pacientes", href: "/pacientes", icon: UsersRound },
  { label: "Prontuários", href: "/prontuarios", icon: FileText },
  { label: "WhatsApp IA", href: "/whatsapp", icon: Bot },
  { label: "Compliance", href: "/compliance", icon: ShieldCheck },
];

export function MobileNav({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {open ? (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      ) : null}
      <div
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transition-transform duration-200 ease-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--line)]">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-[var(--brand)] text-white">
              <HeartHandshake aria-hidden="true" size={22} strokeWidth={1.8} />
            </div>
            <p className="text-base font-semibold text-stone-950">Clínica IA</p>
          </div>
          <button
            className="rounded-md p-1.5 text-stone-500 hover:bg-[var(--surface-muted)] hover:text-stone-700"
            onClick={onClose}
            type="button"
            aria-label="Fechar menu"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        <nav aria-label="Navegação principal" className="px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
            return (
              <Link
                className={clsx(
                  "flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium transition",
                  isActive
                    ? "bg-[var(--brand-subtle)] text-[var(--brand-strong)]"
                    : "text-stone-600 hover:bg-[var(--surface-muted)]",
                )}
                href={item.href}
                key={item.href}
                onClick={onClose}
              >
                <item.icon aria-hidden="true" size={20} strokeWidth={1.9} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-[var(--line)] px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
            Conta
          </p>
          <div className="mt-2 space-y-1 text-sm">
            <p className="font-semibold text-stone-900">{psychologistProfile.name}</p>
            <p className="text-stone-500">{psychologistProfile.crp}</p>
            <p className="text-stone-500">{psychologistProfile.city}</p>
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 3: Commit**

---

### Task 8: Criar (dashboard)/layout.tsx

**Files:**
- Create: `src/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Criar layout com sidebar, header, mobile nav e gerenciamento de estado**

```tsx
"use client";

import { useState } from "react";
import { Sidebar } from "./_components/sidebar";
import { Header } from "./_components/header";
import { MobileNav } from "./_components/mobile-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

---

### Task 9: Criar página Home (dashboard operacional)

**Files:**
- Rewrite: `src/app/page.tsx` → moves to `src/app/(dashboard)/page.tsx`
- Delete old: `src/app/page.tsx`

- [ ] **Step 1: Reescrever a Home usando componentes extraídos**

The dashboard home page uses StatCard, Panel, QueueItem, etc. and shows:
- 4 StatCards
- Fila de trabalho
- Próximas sessões
- Paciente em foco
- Coluna lateral (WhatsApp, notificações, slots, compliance resumido)

- [ ] **Step 2: Commit**

---

### Task 10: Criar página Agenda

**Files:**
- Create: `src/app/(dashboard)/agenda/page.tsx`

- [ ] **Step 1: Página de agenda completa com busca e filtros**

Show the full sessions table with SearchInput + FilterBar + SessionRow list.

- [ ] **Step 2: Commit**

---

### Task 11: Criar páginas Pacientes e Pacientes/[id]

**Files:**
- Create: `src/app/(dashboard)/pacientes/page.tsx`
- Create: `src/app/(dashboard)/pacientes/[id]/page.tsx`

- [ ] **Step 1: Grid de pacientes com busca**

- [ ] **Step 2: Detalhe do paciente com sessões, prontuários e anotações**

- [ ] **Step 3: Commit**

---

### Task 12: Criar páginas Prontuários e Prontuários/[id]

**Files:**
- Create: `src/app/(dashboard)/prontuarios/page.tsx`
- Create: `src/app/(dashboard)/prontuarios/[id]/page.tsx`

- [ ] **Step 1: Lista de prontuários com filtro**

- [ ] **Step 2: Visualização completa do prontuário**

- [ ] **Step 3: Commit**

---

### Task 13: Criar página WhatsApp IA

**Files:**
- Create: `src/app/(dashboard)/whatsapp/page.tsx`

- [ ] **Step 1: Página com status do agente e configurações**

- [ ] **Step 2: Commit**

---

### Task 14: Criar página Compliance

**Files:**
- Create: `src/app/(dashboard)/compliance/page.tsx`

- [ ] **Step 1: Página de compliance com checklist**

- [ ] **Step 2: Commit**

---

### Task 15: Verificação final — build e lint

**Files:** all

- [ ] **Step 1: Rodar TypeScript check**

Run: `npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 2: Rodar lint**

Run: `npm run lint`
Expected: sem erros

- [ ] **Step 3: Rodar build**

Run: `npm run build`
Expected: build bem-sucedido

- [ ] **Step 4: Commit se houver ajustes**
