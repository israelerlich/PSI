import type { TherapySession } from "@/lib/domain";
import { Badge } from "./badge";

const paymentVariant = {
  PAGO: "success" as const,
  PENDENTE: "warning" as const,
};

const confirmationLabel = {
  pending: "Aguardando",
  confirmed: "Confirmada",
  reschedule_requested: "Quer remarcar",
  rescheduled: "Remarcada",
  manual_review: "Revisar",
};

const confirmationVariant = {
  pending: "warning" as const,
  confirmed: "success" as const,
  reschedule_requested: "warning" as const,
  rescheduled: "info" as const,
  manual_review: "danger" as const,
};

const attendanceLabel = {
  expected: "Prevista",
  present: "Presente",
  missed: "Falta",
  excused: "Justificada",
};

const attendanceVariant = {
  expected: "neutral" as const,
  present: "success" as const,
  missed: "danger" as const,
  excused: "warning" as const,
};

export function SessionRow({ session }: { session: TherapySession }) {
  const confirmationStatus = session.confirmationStatus ?? "pending";
  const attendanceStatus = session.attendanceStatus ?? "expected";
  const documentationLabel =
    session.documentationStatus === "complete"
      ? "concluído"
      : session.documentationStatus === "draft"
        ? "rascunho"
        : "pendente";
  const financeLabel =
    session.invoiceStatus === "issued"
      ? "NFS-e emitida"
      : session.chargeStatus === "paid"
        ? "Pago / recibo"
        : session.chargeStatus === "pix_sent"
          ? "Pix enviado"
          : session.paymentStatus;

  const formatTime = (value: string) =>
    new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    }).format(new Date(value));

  return (
    <article className="row-hover grid grid-cols-1 gap-3 px-5 py-4 lg:grid-cols-[78px_1.3fr_0.85fr_0.8fr_0.85fr] lg:items-center">
      <div>
        <p className="metric-number text-[15px] font-semibold text-[var(--ink)]">
          {formatTime(session.startsAt)}
        </p>
        <p className="mt-0.5 text-[11.5px] text-[var(--ink-5)]">
          {session.modality === "online" ? "Online" : "Presencial"}
        </p>
      </div>

      <div className="min-w-0">
        <p className="text-[14px] font-semibold text-[var(--ink)]">
          {session.patientName}
        </p>
        <p className="mt-0.5 text-[12.5px] text-[var(--ink-4)]">
          {session.serviceType} · {session.location}
        </p>
        <p className="mt-1 text-[11.5px] text-[var(--ink-5)]">
          Lembrete {session.reminderStatus === "sent" ? "enviado" : "agendado"} ·
          Prontuário {documentationLabel}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5 lg:hidden">
          <Badge variant={confirmationVariant[confirmationStatus]}>
            {confirmationLabel[confirmationStatus]}
          </Badge>
          <Badge variant={attendanceVariant[attendanceStatus]}>
            {attendanceLabel[attendanceStatus]}
          </Badge>
          <Badge variant={paymentVariant[session.paymentStatus]}>
            {financeLabel}
          </Badge>
        </div>
      </div>

      <div className="max-lg:hidden">
        <Badge variant={confirmationVariant[confirmationStatus]}>
          {confirmationLabel[confirmationStatus]}
        </Badge>
      </div>
      <div className="max-lg:hidden">
        <Badge variant={attendanceVariant[attendanceStatus]}>
          {attendanceLabel[attendanceStatus]}
        </Badge>
      </div>
      <div className="max-lg:hidden">
        <Badge variant={paymentVariant[session.paymentStatus]}>
          {financeLabel}
        </Badge>
      </div>
    </article>
  );
}
