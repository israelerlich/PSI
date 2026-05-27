import Link from "next/link";
import type { TherapySession } from "@prisma/client";
import { Panel } from "../../../_components/panel";
import { Badge } from "../../../_components/badge";
import { formatDateTime } from "@/lib/format/date";
import { CalendarDays } from "lucide-react";

export function SessionsSection({ sessions }: { sessions: TherapySession[] }) {
  return (
    <Panel
      eyebrow="Histórico"
      title="Sessões"
      icon={CalendarDays}
      padded={false}
    >
      {sessions.length === 0 ? (
        <p className="px-5 py-6 text-[13px] text-[var(--ink-4)]">
          Nenhuma sessão registrada.
        </p>
      ) : (
        <div className="divide-y divide-[var(--border)]">
          {sessions.map((s) => (
            <article
              key={s.id}
              className="row-hover grid grid-cols-[1fr_auto] gap-3 px-5 py-3 items-center"
            >
              <div>
                <Link
                  href={`/agenda/${s.id}`}
                  className="text-[14px] font-semibold text-[var(--ink)] hover:text-[var(--blue)]"
                >
                  {formatDateTime(s.startsAt)}
                </Link>
                <p className="mt-0.5 text-[12.5px] text-[var(--ink-4)]">
                  {s.serviceType} · {s.modality}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge
                  variant={
                    s.status === "CONCLUIDA"
                      ? "success"
                      : s.status === "CANCELADA" || s.status === "NAO_COMPARECEU"
                        ? "danger"
                        : "neutral"
                  }
                >
                  {s.status}
                </Badge>
                <Badge
                  variant={s.paymentStatus === "PAGO" ? "success" : "warning"}
                >
                  {s.paymentStatus === "PAGO" ? "Pago" : "Pendente"}
                </Badge>
              </div>
            </article>
          ))}
        </div>
      )}
    </Panel>
  );
}
