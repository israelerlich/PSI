import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { getPatient } from "@/server/queries/patient";
import { listSessionsForPatient } from "@/server/queries/session";
import { listRecordsForPatient } from "@/server/queries/record";
import { billingForPatient } from "@/server/queries/billing";
import { prisma } from "@/lib/db";
import { Badge } from "../../_components/badge";
import {
  formatWhatsappForDisplay,
  whatsappToWaMeLink,
} from "@/lib/format/phone";
import { SessionsSection } from "./_components/SessionsSection";
import { RecordsSection } from "./_components/RecordsSection";
import { NotesSection } from "./_components/NotesSection";
import { BillingSection } from "./_components/BillingSection";

export const dynamic = "force-dynamic";

export default async function PacienteDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const patient = await getPatient(user.id, id);
  if (!patient) notFound();

  const [sessions, records, notes, billing] = await Promise.all([
    listSessionsForPatient(user.id, id),
    listRecordsForPatient(user.id, id),
    prisma.note.findMany({
      where: { userId: user.id, patientId: id },
      orderBy: { createdAt: "desc" },
    }),
    billingForPatient(user.id, id),
  ]);

  const initials = patient.name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("");

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
      <Link
        href="/pacientes"
        className="btn btn-ghost btn-sm -ml-2 mb-4 inline-flex"
      >
        <ArrowLeft size={14} strokeWidth={1.8} /> Voltar
      </Link>

      <header className="card mb-5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-[var(--blue-soft)] text-[17px] font-semibold text-[var(--blue-text)]">
              {initials}
            </div>
            <div>
              <h1 className="h-page text-[22px]">{patient.name}</h1>
              <p className="mt-1 text-[13px] text-[var(--ink-4)]">
                {patient.whatsapp
                  ? formatWhatsappForDisplay(patient.whatsapp)
                  : "Sem WhatsApp"}
                {patient.email ? ` · ${patient.email}` : ""}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge
                  variant={patient.modality === "online" ? "info" : "neutral"}
                >
                  {patient.modality === "online" ? "Online" : "Presencial"}
                </Badge>
                <Badge
                  variant={
                    patient.consentStatus === "complete"
                      ? "success"
                      : patient.consentStatus === "expired"
                        ? "danger"
                        : "warning"
                  }
                >
                  Consentimento {patient.consentStatus}
                </Badge>
              </div>
            </div>
          </div>
          {patient.whatsapp ? (
            <a
              href={whatsappToWaMeLink(patient.whatsapp)}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
            >
              <MessageCircle size={15} strokeWidth={1.8} /> Abrir WhatsApp
            </a>
          ) : null}
        </div>
      </header>

      <nav
        className="mb-5 flex flex-wrap gap-2 text-[13px]"
        aria-label="Atalhos"
      >
        <a href="#sessoes" className="btn btn-ghost btn-sm">
          Sessões ({sessions.length})
        </a>
        <a href="#prontuarios" className="btn btn-ghost btn-sm">
          Prontuários ({records.length})
        </a>
        <a href="#anotacoes" className="btn btn-ghost btn-sm">
          Anotações ({notes.length})
        </a>
        <a href="#financeiro" className="btn btn-ghost btn-sm">
          Financeiro ({billing.length})
        </a>
      </nav>

      <div className="space-y-5">
        <section id="sessoes" className="scroll-mt-20">
          <SessionsSection sessions={sessions} />
        </section>
        <section id="prontuarios" className="scroll-mt-20">
          <RecordsSection records={records} />
        </section>
        <section id="anotacoes" className="scroll-mt-20">
          <NotesSection notes={notes} patientId={patient.id} />
        </section>
        <section id="financeiro" className="scroll-mt-20">
          <BillingSection billing={billing} />
        </section>
      </div>
    </div>
  );
}
