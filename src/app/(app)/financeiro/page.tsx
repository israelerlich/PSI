import { Banknote, ReceiptText, TrendingUp, WalletCards } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { listBilling, billingTotals } from "@/server/queries/billing";
import { StatCard } from "../_components/stat-card";
import { Panel } from "../_components/panel";
import { Badge } from "../_components/badge";
import { formatBRL } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/date";
import { MarkPaidButton } from "./_components/MarkPaidButton";

export const dynamic = "force-dynamic";

export default async function FinanceiroPage() {
  const user = await requireUser();
  const [entries, totals] = await Promise.all([
    listBilling(user.id),
    billingTotals(user.id),
  ]);

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6">
        <p className="label">Financeiro</p>
        <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-[var(--ink)]">
          Recebimentos e cobranças
        </h2>
      </div>
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Banknote}
          label="Recebido"
          value={formatBRL(totals.receivedCents)}
          detail="Pagamentos confirmados"
        />
        <StatCard
          icon={WalletCards}
          label="Pendente"
          value={formatBRL(totals.pendingCents)}
          detail="Aguardando pagamento"
        />
        <StatCard
          icon={TrendingUp}
          label="Previsto"
          value={formatBRL(totals.forecastCents)}
          detail="Recebido + pendente"
        />
        <StatCard
          icon={ReceiptText}
          label="Entradas"
          value={entries.length.toString()}
          detail="Total registrado"
        />
      </section>

      <div className="mt-6">
        <Panel
          eyebrow="Atendimentos"
          title="Cobranças"
          icon={WalletCards}
          padded={false}
        >
          {entries.length === 0 ? (
            <p className="p-5 text-[13px] text-[var(--ink-4)]">
              Sem cobranças. Elas aparecem aqui automaticamente quando você
              agenda uma sessão.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-[1.2fr_0.85fr_0.7fr_auto] border-b border-[var(--border)] bg-[var(--surface-2)] px-5 py-2.5 max-lg:hidden">
                <span className="label-strong">Paciente</span>
                <span className="label-strong">Valor</span>
                <span className="label-strong">Pagamento</span>
                <span className="label-strong">Ações</span>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {entries.map((e) => (
                  <article
                    key={e.id}
                    className="row-hover grid grid-cols-1 gap-3 px-5 py-4 lg:grid-cols-[1.2fr_0.85fr_0.7fr_auto] lg:items-center"
                  >
                    <div>
                      <p className="text-[14px] font-semibold text-[var(--ink)]">
                        {e.patient.name}
                      </p>
                      <p className="mt-0.5 text-[12.5px] text-[var(--ink-4)]">
                        {e.serviceType} · {formatDate(e.serviceDate)}
                      </p>
                    </div>
                    <p className="metric-number text-[15px] font-semibold text-[var(--ink)]">
                      {formatBRL(e.amountCents)}
                    </p>
                    <Badge
                      variant={e.paymentStatus === "PAGO" ? "success" : "warning"}
                    >
                      {e.paymentStatus === "PAGO" ? "Pago" : "Pendente"}
                    </Badge>
                    <div>
                      {e.paymentStatus === "PENDENTE" ? (
                        <MarkPaidButton billingId={e.id} />
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}
