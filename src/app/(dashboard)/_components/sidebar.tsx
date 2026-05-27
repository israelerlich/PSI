"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bot,
  CalendarDays,
  FileText,
  HeartPulse,
  ReceiptText,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { psychologistProfile } from "@/lib/mock-data";

const navItems = [
  { label: "Visão geral", href: "/", icon: Activity },
  { label: "Agenda", href: "/agenda", icon: CalendarDays },
  { label: "Pacientes", href: "/pacientes", icon: UsersRound },
  { label: "Prontuários", href: "/prontuarios", icon: FileText },
  { label: "Financeiro", href: "/financeiro", icon: ReceiptText },
  { label: "WhatsApp IA", href: "/whatsapp", icon: Bot },
  { label: "Compliance", href: "/compliance", icon: ShieldCheck },
];

export function Sidebar() {
  const pathname = usePathname();

  const initials = psychologistProfile.name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("");

  return (
    <aside className="hidden w-64 shrink-0 border-r border-[var(--border)] bg-[var(--surface)] lg:flex lg:flex-col">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 border-b border-[var(--border)] px-5">
        <div className="flex size-8 items-center justify-center rounded-md bg-[var(--blue)] text-white">
          <HeartPulse aria-hidden="true" size={17} strokeWidth={2.2} />
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-semibold leading-tight text-[var(--ink)]">
            Clínica IA
          </p>
          <p className="text-[11px] leading-tight text-[var(--ink-4)]">
            Painel do psicólogo
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav
        aria-label="Navegação principal"
        className="flex-1 overflow-y-auto px-3 py-4"
      >
        <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-5)]">
          Operação
        </p>
        <ul className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  data-active={isActive}
                  className="nav-link"
                >
                  <item.icon
                    aria-hidden="true"
                    size={17}
                    strokeWidth={1.8}
                    className="text-[var(--ink-4)]"
                  />
                  <span className="flex-1">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User */}
      <div className="border-t border-[var(--border)] p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-[var(--blue-soft)] text-[var(--blue-text)] text-[12px] font-semibold">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-[var(--ink)]">
              {psychologistProfile.name}
            </p>
            <p className="truncate text-[11.5px] text-[var(--ink-4)]">
              {psychologistProfile.crp}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
