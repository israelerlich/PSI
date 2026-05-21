import type { TherapySession } from "@/lib/domain";
import { Badge } from "./badge";

const sessionStatusVariant: Record<string, "brand" | "warning" | "danger" | "success" | "neutral"> = {
  AGENDADA: "brand",
  REMANEJADA: "warning",
  CANCELADA: "danger",
  CONCLUIDA: "success",
  NAO_COMPARECEU: "neutral",
};

const paymentVariant = {
  PAGO: "success" as const,
  PENDENTE: "warning" as const,
};

export function SessionRow({ session }: { session: TherapySession }) {
  const documentationLabel =
    session.documentationStatus === "complete"
      ? "Concluído"
      : session.documentationStatus === "draft"
        ? "Rascunho"
        : "Pendente";

  const formatTime = (value: string) =>
    new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    }).format(new Date(value));

  return (
    <article className="grid gap-3 px-4 py-4 lg:grid-cols-[80px_1.2fr_0.85fr_0.8fr_0.8fr] lg:items-center">
      <div className="metric-number font-semibold text-stone-950">
        {formatTime(session.startsAt)}
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-stone-950">{session.patientName}</p>
        <p className="mt-1 text-pretty text-sm text-stone-500">
          {session.serviceType} · {session.modality} · {session.location}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 lg:hidden">
          <Badge variant={sessionStatusVariant[session.status]}>
            {session.status.replace("_", " ")}
          </Badge>
          <Badge variant={paymentVariant[session.paymentStatus]}>
            {session.paymentStatus}
          </Badge>
        </div>
      </div>
      <div className="max-lg:hidden">
        <Badge variant={sessionStatusVariant[session.status]}>
          {session.status.replace("_", " ")}
        </Badge>
      </div>
      <div className="max-lg:hidden">
        <Badge variant="info">{documentationLabel}</Badge>
      </div>
      <div className="max-lg:hidden">
        <Badge variant={paymentVariant[session.paymentStatus]}>
          {session.paymentStatus}
        </Badge>
      </div>
    </article>
  );
}
