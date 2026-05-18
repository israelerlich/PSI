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
  rescheduled: "brand" as const,
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
    <article className="grid grid-cols-1 gap-3 px-4 py-4 lg:grid-cols-[80px_1.2fr_0.9fr_0.85fr_0.95fr] lg:items-center">
      <div className="font-semibold text-stone-950">
        {formatTime(session.startsAt)}
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-stone-950">{session.patientName}</p>
        <p className="mt-1 break-words text-sm text-stone-500">
          {session.serviceType} · {session.modality} · {session.location}
        </p>
        <p className="mt-1 text-xs font-medium text-stone-500">
          Lembrete: {session.reminderStatus === "sent" ? "enviado" : "agendado"} ·
          Prontuário: {documentationLabel}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 lg:hidden">
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
