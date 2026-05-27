"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  CalendarDays,
  FileText,
  HeartPulse,
  ReceiptText,
  Settings,
  ShieldCheck,
  UsersRound,
  X,
} from "lucide-react";
import clsx from "clsx";

const navItems = [
  { label: "Hoje", href: "/", icon: Activity },
  { label: "Agenda", href: "/agenda", icon: CalendarDays },
  { label: "Pacientes", href: "/pacientes", icon: UsersRound },
  { label: "Prontuários", href: "/prontuarios", icon: FileText },
  { label: "Financeiro", href: "/financeiro", icon: ReceiptText },
  { label: "Compliance", href: "/compliance", icon: ShieldCheck },
  { label: "Configurações", href: "/configuracoes", icon: Settings },
];

export function MobileNav({
  open,
  onClose,
  userName,
  userCrp,
}: {
  open: boolean;
  onClose: () => void;
  userName: string;
  userCrp: string;
}) {
  const pathname = usePathname();

  return (
    <>
      {open ? (
        <div
          className="fixed inset-0 z-40 bg-[var(--ink)]/30 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      ) : null}
      <div
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-pop)] transition-transform duration-200 ease-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-[var(--border)] px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-md bg-[var(--blue)] text-white">
              <HeartPulse aria-hidden="true" size={17} strokeWidth={2.2} />
            </div>
            <p className="text-[14px] font-semibold text-[var(--ink)]">
              Clínica IA
            </p>
          </div>
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={onClose}
            className="btn btn-ghost size-9 px-0"
          >
            <X aria-hidden="true" size={18} strokeWidth={1.8} />
          </button>
        </div>

        <nav
          aria-label="Navegação principal"
          className="flex-1 overflow-y-auto px-3 py-4"
        >
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
                    onClick={onClose}
                    data-active={isActive}
                    className="nav-link min-h-11"
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

        <div className="border-t border-[var(--border)] p-4">
          <p className="text-[13px] font-semibold text-[var(--ink)]">
            {userName}
          </p>
          <p className="mt-0.5 text-[11.5px] text-[var(--ink-4)]">{userCrp}</p>
        </div>
      </div>
    </>
  );
}
