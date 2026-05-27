"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  CalendarDays,
  FileText,
  UsersRound,
  WalletCards,
} from "lucide-react";

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
        const isActive =
          it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
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
