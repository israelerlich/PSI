import { requireUser } from "@/lib/auth-helpers";
import { listSessionsInRange } from "@/server/queries/session";
import { listPatients } from "@/server/queries/patient";
import { AgendaView } from "./_components/AgendaView";

export const dynamic = "force-dynamic";

function rangeFor(period: string): { from: Date; to: Date } {
  const now = new Date();
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  if (period === "Semana") to.setDate(to.getDate() + 7);
  else if (period === "Mês") to.setMonth(to.getMonth() + 1);
  else to.setDate(to.getDate() + 1);
  return { from, to };
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const user = await requireUser();
  const { p = "Hoje" } = await searchParams;
  const { from, to } = rangeFor(p);
  const sessions = await listSessionsInRange(user.id, from, to);
  const patients = await listPatients(user.id, {});

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
      <AgendaView
        sessions={sessions}
        patients={patients}
        initialPeriod={p}
        defaultPriceCents={user.defaultSessionPriceCents}
      />
    </div>
  );
}
