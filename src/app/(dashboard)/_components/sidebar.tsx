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
          const isActive =
            item.href === "/"
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
          <p className="font-semibold text-stone-900">
            {psychologistProfile.name}
          </p>
          <p className="text-stone-500">{psychologistProfile.crp}</p>
          <p className="text-stone-500">{psychologistProfile.city}</p>
        </div>
      </div>
    </aside>
  );
}
