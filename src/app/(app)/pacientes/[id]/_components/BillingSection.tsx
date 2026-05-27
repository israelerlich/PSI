import type { BillingEntry } from "@prisma/client";
import { Panel } from "../../../_components/panel";
import { Badge } from "../../../_components/badge";
import { formatBRL } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/date";
import { ReceiptText } from "lucide-react";

export function BillingSection({ billing }: { billing: BillingEntry[] }) {
  return (
    <Panel
      eyebrow="Cobranças"
      title="Financeiro"
      icon={ReceiptText}
      padded={false}
    >
      {billing.length === 0 ? (
        <p className="px-5 py-6 text-[13px] text-[var(--ink-4)]">
          Sem entradas financeiras.
        </p>
      ) : (
        <div className="divide-y divide-[var(--border)]">
          {billing.map((b) => (
            <article
              key={b.id}
              className="row-hover grid grid-cols-[1fr_auto] gap-3 px-5 py-3 items-center"
            >
              <div>
                <p className="metric-number text-[14px] font-semibold text-[var(--ink)]">
                  {formatBRL(b.amountCents)}
                </p>
                <p className="mt-0.5 text-[12.5px] text-[var(--ink-4)]">
                  {b.serviceType} · {formatDate(b.serviceDate)}
                </p>
              </div>
              <Badge
                variant={b.paymentStatus === "PAGO" ? "success" : "warning"}
              >
                {b.paymentStatus === "PAGO" ? "Pago" : "Pendente"}
              </Badge>
            </article>
          ))}
        </div>
      )}
    </Panel>
  );
}
