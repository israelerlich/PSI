import {
  Banknote,
  FileCheck2,
  ReceiptText,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { billingEntries } from "@/lib/mock-data";
import { Panel } from "../_components/panel";
import { Badge } from "../_components/badge";
import { StatCard } from "../_components/stat-card";

const paymentVariant = {
  PAGO: "success" as const,
  PENDENTE: "warning" as const,
};

const invoiceLabel = {
  not_required: "Não exigida",
  ready: "Pronta",
  queued: "Na fila",
  issued: "Emitida",
  failed: "Falhou",
};

const invoiceVariant = {
  not_required: "neutral" as const,
  ready: "warning" as const,
  queued: "info" as const,
  issued: "success" as const,
  failed: "danger" as const,
};

const receiptLabel = {
  not_ready: "Aguardando",
  ready: "Pronto",
  sent: "Enviado",
};

export default function FinanceiroPage() {
  const received = billingEntries
    .filter((e) => e.paymentStatus === "PAGO")
    .reduce((sum, e) => sum + e.amountCents, 0);
  const pending = billingEntries
    .filter((e) => e.paymentStatus === "PENDENTE")
    .reduce((sum, e) => sum + e.amountCents, 0);
  const forecast = billingEntries.reduce((sum, e) => sum + e.amountCents, 0);
  const fiscalQueue = billingEntries.filter(
    (e) => e.invoiceStatus === "ready" || e.invoiceStatus === "queued",
  );

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6">
        <p className="label">Financeiro</p>
        <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-[var(--ink)]">
          Recebimentos, NFS-e e relatórios
        </h2>
        <p className="mt-1 text-[13px] text-[var(--ink-4)]">
          Visão geral do mês corrente — sem cobrança automática.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Banknote}
          label="Recebido"
          value={formatCurrency(received)}
          trend={{ label: "Pagamentos confirmados", tone: "positive" }}
          detail=""
        />
        <StatCard
          icon={WalletCards}
          label="Pendente"
          value={formatCurrency(pending)}
          trend={{ label: "Pix em aberto", tone: "neutral" }}
          detail=""
        />
        <StatCard
          icon={TrendingUp}
          label="Previsto no mês"
          value={formatCurrency(forecast)}
          detail="Atendido + agendado"
        />
        <StatCard
          icon={ReceiptText}
          label="NFS-e"
          value={fiscalQueue.length.toString()}
          detail="Prontas para emissão"
        />
      </section>

      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[1fr_380px]">
        <Panel
          eyebrow="Atendimentos"
          icon={WalletCards}
          title="Cobranças, recibos e relatórios"
          padded={false}
        >
          <div className="grid grid-cols-[1.2fr_0.85fr_0.7fr_0.8fr_0.8fr] border-b border-[var(--border)] bg-[var(--surface-2)] px-5 py-2.5 max-lg:hidden">
            <span className="label-strong">Paciente</span>
            <span className="label-strong">Valor</span>
            <span className="label-strong">Pagamento</span>
            <span className="label-strong">NFS-e</span>
            <span className="label-strong">Recibo</span>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {billingEntries.map((entry) => (
              <article
                key={entry.id}
                className="row-hover grid grid-cols-1 gap-3 px-5 py-4 lg:grid-cols-[1.2fr_0.85fr_0.7fr_0.8fr_0.8fr] lg:items-center"
              >
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-[var(--ink)]">
                    {entry.patientName}
                  </p>
                  <p className="mt-0.5 text-[12.5px] text-[var(--ink-4)]">
                    {entry.serviceType} · {formatDate(entry.serviceDate)}
                  </p>
                </div>
                <p className="metric-number text-[15px] font-semibold text-[var(--ink)]">
                  {formatCurrency(entry.amountCents)}
                </p>
                <Badge variant={paymentVariant[entry.paymentStatus]}>
                  {entry.paymentStatus}
                </Badge>
                <Badge variant={invoiceVariant[entry.invoiceStatus]}>
                  {invoiceLabel[entry.invoiceStatus]}
                </Badge>
                <Badge
                  variant={
                    entry.receiptStatus === "sent" ? "success" : "neutral"
                  }
                >
                  {receiptLabel[entry.receiptStatus]}
                </Badge>
              </article>
            ))}
          </div>
        </Panel>

        <aside className="space-y-5">
          <Panel
            eyebrow="Nota fiscal"
            icon={ReceiptText}
            title="Fila de NFS-e"
            padded={false}
          >
            <div className="divide-y divide-[var(--border)]">
              {fiscalQueue.map((entry) => (
                <div key={entry.id} className="px-5 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-[var(--ink)]">
                        {entry.patientName}
                      </p>
                      <p className="mt-0.5 text-[12.5px] text-[var(--ink-4)]">
                        {formatCurrency(entry.amountCents)} ·{" "}
                        {formatDate(entry.serviceDate)}
                      </p>
                    </div>
                    <Badge variant={invoiceVariant[entry.invoiceStatus]}>
                      {invoiceLabel[entry.invoiceStatus]}
                    </Badge>
                  </div>
                  <Link
                    href={`/api/billing/invoices/${entry.id}`}
                    target="_blank"
                    className="btn btn-secondary btn-sm mt-2.5"
                  >
                    Emitir NFS-e
                  </Link>
                </div>
              ))}
            </div>
          </Panel>

          <Panel eyebrow="Relatório" icon={FileCheck2} title="Mês atual">
            <dl className="space-y-3">
              <ReportLine label="Atendimentos" value={`${billingEntries.length}`} />
              <ReportLine label="Recebido" value={formatCurrency(received)} />
              <ReportLine label="Pendente" value={formatCurrency(pending)} />
              <ReportLine
                label="Recibos enviados"
                value={`${billingEntries.filter((e) => e.receiptStatus === "sent").length}`}
              />
            </dl>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function ReportLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-[var(--surface-2)] px-3 py-2.5">
      <dt className="text-[13px] text-[var(--ink-3)]">{label}</dt>
      <dd className="metric-number text-[14px] font-semibold text-[var(--ink)]">
        {value}
      </dd>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(value / 100);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}
