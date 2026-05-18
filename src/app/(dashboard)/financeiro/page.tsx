import {
  Banknote,
  FileCheck2,
  ReceiptText,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { billingEntries } from "@/lib/mock-data";
import { Panel } from "../_components/panel";
import { Badge } from "../_components/badge";

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
  queued: "brand" as const,
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
    .filter((entry) => entry.paymentStatus === "PAGO")
    .reduce((sum, entry) => sum + entry.amountCents, 0);
  const pending = billingEntries
    .filter((entry) => entry.paymentStatus === "PENDENTE")
    .reduce((sum, entry) => sum + entry.amountCents, 0);
  const forecast = billingEntries.reduce(
    (sum, entry) => sum + entry.amountCents,
    0,
  );
  const fiscalQueue = billingEntries.filter(
    (entry) => entry.invoiceStatus === "ready" || entry.invoiceStatus === "queued",
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <section
            aria-label="Resumo financeiro"
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
          >
            <FinanceMetric
              icon={Banknote}
              label="Recebido"
              value={formatCurrency(received)}
              detail="Pagamentos confirmados"
            />
            <FinanceMetric
              icon={WalletCards}
              label="Pendente"
              value={formatCurrency(pending)}
              detail="Pix ou cobrança aberta"
            />
            <FinanceMetric
              icon={TrendingUp}
              label="Previsto no mês"
              value={formatCurrency(forecast)}
              detail="Atendido + agendado"
            />
            <FinanceMetric
              icon={ReceiptText}
              label="NFS-e"
              value={fiscalQueue.length.toString()}
              detail="Prontas para emissão"
            />
          </section>

          <Panel
            eyebrow="Atendimentos"
            icon={WalletCards}
            title="Cobranças, recibos e relatórios"
          >
            <div className="overflow-hidden rounded-md border border-[var(--line)]">
              <div className="grid grid-cols-[1.15fr_0.8fr_0.75fr_0.75fr_0.75fr] bg-[var(--surface-muted)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-stone-600 max-lg:hidden">
                <span>Paciente</span>
                <span>Valor</span>
                <span>Pagamento</span>
                <span>NFS-e</span>
                <span>Recibo</span>
              </div>
              <div className="divide-y divide-[var(--line)]">
                {billingEntries.map((entry) => (
                  <article
                    className="grid grid-cols-1 gap-3 px-4 py-4 lg:grid-cols-[1.15fr_0.8fr_0.75fr_0.75fr_0.75fr] lg:items-center"
                    key={entry.id}
                  >
                  <div>
                    <p className="font-semibold text-stone-950">
                      {entry.patientName}
                      </p>
                      <p className="mt-1 text-sm text-stone-500">
                        {entry.serviceType} · {formatDate(entry.serviceDate)}
                      </p>
                    </div>
                    <p className="font-semibold text-stone-950">
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
            </div>
          </Panel>
        </div>

        <aside className="space-y-6">
          <Panel eyebrow="Nota fiscal" icon={ReceiptText} title="Fila de NFS-e">
            <div className="space-y-3">
              {fiscalQueue.map((entry) => (
                <div
                  className="rounded-md border border-[var(--line)] p-3"
                  key={entry.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-stone-950">
                        {entry.patientName}
                      </p>
                      <p className="mt-1 text-sm text-stone-500">
                        {formatCurrency(entry.amountCents)} · {formatDate(entry.serviceDate)}
                      </p>
                    </div>
                  <Badge variant={invoiceVariant[entry.invoiceStatus]}>
                    {invoiceLabel[entry.invoiceStatus]}
                  </Badge>
                </div>
                <a
                  className="mt-3 inline-flex h-9 items-center rounded-md border border-[var(--line)] px-3 text-sm font-semibold text-stone-600 transition hover:bg-[var(--surface-muted)]"
                  href={`/api/billing/invoices/${entry.id}`}
                  target="_blank"
                >
                  Emitir NFS-e
                </a>
              </div>
            ))}
            </div>
          </Panel>

          <Panel eyebrow="Relatório" icon={FileCheck2} title="Mês atual">
            <dl className="space-y-4 text-sm">
              <ReportLine label="Atendimentos" value={`${billingEntries.length}`} />
              <ReportLine label="Recebido" value={formatCurrency(received)} />
              <ReportLine label="Pendente" value={formatCurrency(pending)} />
              <ReportLine
                label="Recibos enviados"
                value={`${billingEntries.filter((entry) => entry.receiptStatus === "sent").length}`}
              />
            </dl>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function FinanceMetric({
  detail,
  icon: Icon,
  label,
  value,
}: {
  detail: string;
  icon: React.ComponentType<{
    className?: string;
    size?: number;
    strokeWidth?: number;
  }>;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-lg border border-[var(--line)] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-stone-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-stone-950">{value}</p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-md bg-[var(--surface-muted)] text-[var(--brand)]">
          <Icon aria-hidden="true" size={20} strokeWidth={1.9} />
        </div>
      </div>
      <p className="mt-3 text-sm text-stone-500">{detail}</p>
    </article>
  );
}

function ReportLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-[var(--surface-muted)] p-3">
      <dt className="text-stone-500">{label}</dt>
      <dd className="font-semibold text-stone-950">{value}</dd>
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
