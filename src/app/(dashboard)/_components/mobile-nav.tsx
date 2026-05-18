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
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
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

        <nav aria-label="Navegação principal" className="space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
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
            <p className="font-semibold text-stone-900">
              {psychologistProfile.name}
            </p>
            <p className="text-stone-500">{psychologistProfile.crp}</p>
            <p className="text-stone-500">{psychologistProfile.city}</p>
          </div>
        </div>
      </div>
    </>
  );
}
