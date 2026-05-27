import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { getSession } from "@/server/queries/session";
import { AttendForm } from "./AttendForm";

export const dynamic = "force-dynamic";

export default async function AttendPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const session = await getSession(user.id, id);
  if (!session) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <Link
        href="/agenda"
        className="btn btn-ghost btn-sm -ml-2 mb-4 inline-flex"
      >
        <ArrowLeft size={14} strokeWidth={1.8} /> Voltar para agenda
      </Link>
      <header className="mb-5">
        <p className="label">Atender sessão</p>
        <h1 className="h-page mt-1">{session.patient.name}</h1>
        <p className="mt-1 text-[13px] text-[var(--ink-4)]">
          {new Intl.DateTimeFormat("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "America/Sao_Paulo",
          }).format(session.startsAt)}
          {" · "}
          {session.modality === "online" ? "Online" : "Presencial"}
        </p>
      </header>
      <AttendForm session={session} />
    </div>
  );
}
